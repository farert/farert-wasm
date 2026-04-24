/**
 * test_azusa.cpp
 *
 * azusa.h/azusa.cpp の全関数を網羅した動作確認サンプルコード
 *
 * コンパイル方法:
 *   cd test/unix/all
 *   make test_azusa
 *   source start.sh
 *   ./test_azusa
 */

#include <iostream>
#include <iomanip>
#include "azusa.h"

// グローバル変数（税率: 10%）
int g_tax = 10;

// テスト結果の表示用マクロ
#define TEST_SECTION(name) \
    std::cout << "\n========================================\n" \
              << "  " << name << "\n" \
              << "========================================\n"

#define TEST_RESULT(name, result) \
    std::cout << "[" << std::setw(40) << std::left << name << "] " \
              << result << std::endl

#define TEST_INT(name, value) \
    std::cout << "[" << std::setw(40) << std::left << name << "] " \
              << value << std::endl

#define TEST_BOOL(name, value) \
    std::cout << "[" << std::setw(40) << std::left << name << "] " \
              << (value ? "true" : "false") << std::endl

int main() {
    std::cout << "===========================================\n"
              << "  Azusa API 全関数動作確認テスト\n"
              << "===========================================\n";

    // ========================================
    // 1. データベースのオープン/クローズ
    // ========================================
    TEST_SECTION("1. データベース操作");

    std::string db_result = open_database();
    TEST_RESULT("open_database()", db_result);

    // ========================================
    // 2. fare_ui 名前空間の関数テスト
    // ========================================
    TEST_SECTION("2. fare_ui - マスターデータ取得");

    // 2-1. 都道府県一覧
    std::string prefects = fare_ui::get_prefects();
    TEST_RESULT("get_prefects()", prefects.substr(0, 100) + "...");

    // 2-2. JR会社一覧
    std::string companies = fare_ui::get_companys();
    TEST_RESULT("get_companys()", companies);

    // 2-3. 都道府県IDと会社ID取得
    TEST_INT("get_prefect_id('東京都')", fare_ui::get_prefect_id("東京都"));
    TEST_INT("get_company_id('JR東日本')", fare_ui::get_company_id("JR東日本"));

    // ========================================
    // 3. fare_ui - 路線データ取得
    // ========================================
    TEST_SECTION("3. fare_ui - 路線データ取得");

    // 3-1. 都道府県の路線一覧
    std::string lines_tokyo = fare_ui::get_lines_by_prefect("東京都");
    TEST_RESULT("get_lines_by_prefect('東京都')", lines_tokyo.substr(0, 100) + "...");

    // 3-2. JR会社の路線一覧
    std::string lines_jre = fare_ui::get_lines_by_company("JR東日本");
    TEST_RESULT("get_lines_by_company('JR東日本')", lines_jre.substr(0, 100) + "...");

    // 3-3. 駅の所属路線
    std::string lines_tokyo_st = fare_ui::get_lines_by_station("東京");
    TEST_RESULT("get_lines_by_station('東京')", lines_tokyo_st);

    // ========================================
    // 4. fare_ui - 駅データ取得
    // ========================================
    TEST_SECTION("4. fare_ui - 駅データ取得");

    // 4-1. 路線の全駅一覧
    std::string stations_tokaido = fare_ui::get_stations_by_line("東海道線");
    TEST_RESULT("get_stations_by_line('東海道線')", stations_tokaido.substr(0, 100) + "...");

    // 4-2. 会社と路線の駅一覧
    std::string stations_jre_tokaido = fare_ui::get_stations_by_company_and_line("JR東日本", "東海道線");
    TEST_RESULT("get_stations_by_company_and_line()", stations_jre_tokaido.substr(0, 100) + "...");

    // 4-3. 都道府県と路線の駅一覧
    std::string stations_tokyo_yamanote = fare_ui::get_stations_by_prefecture_and_line("東京都", "山手線");
    TEST_RESULT("get_stations_by_prefecture_and_line()", stations_tokyo_yamanote.substr(0, 100) + "...");

    // 4-4. 分岐駅一覧
    std::string branch_stations = fare_ui::get_branch_stations_by_line("東海道線", "東京");
    TEST_RESULT("get_branch_stations_by_line()", branch_stations);

    // 4-5. 駅の都道府県
    std::string prefecture = fare_ui::get_prefecture_by_station("東京");
    TEST_RESULT("get_prefecture_by_station('東京')", prefecture);

    // 4-6. 駅名のかな
    std::string kana = fare_ui::get_kana_by_station("東京");
    TEST_RESULT("get_kana_by_station('東京')", kana);

    // 4-7. 駅の検索
    std::string search_result = fare_ui::search_station_by_keyword("新宿");
    TEST_RESULT("search_station_by_keyword('新宿')", search_result);

    // ========================================
    // 5. az_route - 基本的な経路作成
    // ========================================
    TEST_SECTION("5. az_route - 基本的な経路作成");

    az_route route1;

    // 5-1. 出発駅追加
    int result = route1.add_start_route("東京");
    TEST_INT("add_start_route('東京')", result);

    // 5-2. 経路追加
    result = route1.add_route("東海道線", "品川");
    TEST_INT("add_route('東海道線', '品川')", result);

    result = route1.add_route("東海道線", "横浜");
    TEST_INT("add_route('東海道線', '横浜')", result);

    // 5-3. 経路数取得
    TEST_INT("get_route_count()", route1.get_route_count());

    // 5-4. 出発駅名・到着駅名取得
    TEST_RESULT("departure_station_name()", route1.departure_station_name());
    TEST_RESULT("arriveval_station_name()", route1.arriveval_station_name());

    // 5-5. 経路スクリプト取得
    std::string script = route1.route_script();
    TEST_RESULT("route_script()", script);

    // 5-6. 経路をJSON配列で取得
    std::string routes_json = route1.get_routes_json();
    TEST_RESULT("get_routes_json()", routes_json);

    // 5-7. index番目の経路レコード取得
    if (route1.get_route_count() > 0) {
        std::string record = route1.get_route_record(0);
        TEST_RESULT("get_route_record(0)", record);
    }

    // ========================================
    // 6. az_route - 運賃計算
    // ========================================
    TEST_SECTION("6. az_route - 運賃計算");

    // 6-1. 運賃表示
    std::string fare_display = route1.show_fare();
    TEST_RESULT("show_fare()", fare_display.substr(0, 200) + "...");

    // 6-2. 運賃情報オブジェクトJSON取得
    std::string fare_json = route1.get_fare_info_object_json();
    TEST_RESULT("get_fare_info_object_json()", fare_json.substr(0, 200) + "...");

    // ========================================
    // 7. az_route - フラグ設定
    // ========================================
    TEST_SECTION("7. az_route - フラグ設定");

    route1.set_long_route(true);
    TEST_RESULT("set_long_route(true)", "設定完了");

    route1.set_jr_tokai_stock_apply(true);
    TEST_RESULT("set_jr_tokai_stock_apply(true)", "設定完了");

    route1.set_start_as_city();
    TEST_RESULT("set_start_as_city()", "設定完了");

    route1.set_arrival_as_city();
    TEST_RESULT("set_arrival_as_city()", "設定完了");

    route1.set_specific_term_rule115(true);
    TEST_RESULT("set_specific_term_rule115(true)", "設定完了");

    route1.set_no_rule(false);
    TEST_RESULT("set_no_rule(false)", "設定完了");

    route1.set_detour(true);
    TEST_INT("set_detour(true)", result);

    route1.set_not_same_kokura_hakata_shin_zai(true);
    TEST_RESULT("set_not_same_kokura_hakata_shin_zai(true)", "設定完了");

    // ========================================
    // 8. az_route - 状態確認
    // ========================================
    TEST_SECTION("8. az_route - 状態確認");

    TEST_BOOL("is_not_same_kokura_hakata_shin_zai()", route1.is_not_same_kokura_hakata_shin_zai());
    TEST_BOOL("is_available_reverse()", route1.is_available_reverse());
    TEST_BOOL("is_osakakan_detour_enable()", route1.is_osakakan_detour_enable());
    TEST_BOOL("is_osakakan_detour()", route1.is_osakakan_detour());

    // ========================================
    // 9. az_route - 経路操作
    // ========================================
    TEST_SECTION("9. az_route - 経路操作");

    // 9-1. 最後の経路を削除
    route1.remove_tail();
    TEST_INT("remove_tail() 後の経路数", route1.get_route_count());

    // 9-2. 経路の逆転
    int reverse_result = route1.reverse();
    TEST_INT("reverse()", reverse_result);
    TEST_RESULT("reverse() 後の出発駅", route1.departure_station_name());
    TEST_RESULT("reverse() 後の到着駅", route1.arriveval_station_name());

    // 9-3. 通過路線タイプ取得
    if (route1.get_route_count() > 0) {
        TEST_INT("type_of_passed_line(0)", route1.type_of_passed_line(0));
    }

    // ========================================
    // 10. az_route - 自動経路検索
    // ========================================
    TEST_SECTION("10. az_route - 自動経路検索");

    az_route route2;
    route2.add_start_route("東京");

    // 10-1. 新幹線を使用して大阪まで自動経路検索
    int auto_result = route2.auto_route(1, "新大阪");
    TEST_INT("auto_route(1, '新大阪')", auto_result);
    TEST_RESULT("自動検索後の経路", route2.route_script());

    // ========================================
    // 11. az_route - 経路文字列からの構築
    // ========================================
    TEST_SECTION("11. az_route - 経路文字列からの構築");

    az_route route3;
    std::string route_str = "東京 東海道線 横浜 東海道線 小田原";
    std::string build_result = route3.build_route(route_str);
    TEST_RESULT("build_route(route_str)", build_result);
    TEST_RESULT("構築後の経路", route3.route_script());

    // ========================================
    // 11.5. build_route() 省略・曖昧・大阪環状線遠回りの回帰テスト
    // ========================================
    TEST_SECTION("11.5. build_route() 回帰テスト");

    az_route regression_route_1;
    std::string regression_result_1 = regression_route_1.build_route("千歳 千歳線 白石 函館線 岩見沢 室蘭線 追分");
    TEST_RESULT("build_route(千歳→追分)", regression_result_1);
    TEST_RESULT("千歳→追分の経路", regression_route_1.route_script());

    az_route regression_route_2;
    std::string regression_result_2 = regression_route_2.build_route("長崎 西九州新幹線 諫早 長崎線 長与");
    TEST_RESULT("build_route(長崎→長与)", regression_result_2);
    TEST_RESULT("長崎→長与の経路", regression_route_2.route_script());

    az_route regression_route_3;
    std::string regression_result_3 = regression_route_3.build_route("大阪 r大阪環状線 京橋");
    TEST_RESULT("build_route(大阪→京橋 detour)", regression_result_3);
    TEST_RESULT("大阪→京橋 detour の経路", regression_route_3.route_script());

    az_route regression_route_4;
    std::string regression_result_4 = regression_route_4.build_route("長崎 西九州新幹線 諫早 長崎線 新鳥栖 九州新幹線 博多 山陽新幹線 新大阪 東海道線 大阪 r大阪環状線 京橋 片町線 木津");
    TEST_RESULT("build_route(長崎→木津 detour)", regression_result_4);
    TEST_RESULT("長崎→木津 detour の経路", regression_route_4.route_script());

    // ========================================
    // 12. az_route - Rule88 適用例（新大阪-姫路）
    // ========================================
    TEST_SECTION("12. Rule88 適用テスト（新大阪→姫路）");

    az_route route4;
    route4.add_start_route("新大阪");
    route4.add_route("山陽新幹線", "姫路");

    std::string fare4 = route4.show_fare();
    TEST_RESULT("新大阪→姫路の運賃", fare4);

    std::string fare_json4 = route4.get_fare_info_object_json();
    TEST_RESULT("運賃JSON", fare_json4.substr(0, 300) + "...");

    // ========================================
    // 13. az_route - 長距離経路例（東京-大阪）
    // ========================================
    TEST_SECTION("13. 長距離経路テスト（東京→大阪）");

    az_route route5;
    route5.add_start_route("東京");
    route5.add_route("東海道線", "品川");
    route5.add_route("東海道線", "横浜");
    route5.add_route("東海道線", "小田原");
    route5.add_route("東海道線", "熱海");
    route5.add_route("東海道線", "沼津");
    route5.add_route("東海道線", "静岡");
    route5.add_route("東海道線", "浜松");
    route5.add_route("東海道線", "豊橋");
    route5.add_route("東海道線", "名古屋");
    route5.add_route("東海道線", "岐阜");
    route5.add_route("東海道線", "大垣");
    route5.add_route("東海道線", "米原");
    route5.add_route("東海道線", "草津");
    route5.add_route("東海道線", "京都");
    route5.add_route("東海道線", "大阪");

    std::string fare5 = route5.show_fare();
    TEST_RESULT("東京→大阪（在来線）の運賃", fare5);

    // ========================================
    // 14. az_route - すべての経路削除
    // ========================================
    TEST_SECTION("14. 経路の完全削除");

    route5.remove_all();
    TEST_INT("remove_all() 後の経路数", route5.get_route_count());

    // ========================================
    // 15. データベースのクローズ
    // ========================================
    TEST_SECTION("15. データベースクローズ");

    close_database();
    TEST_RESULT("close_database()", "実行完了");

    // ========================================
    // テスト完了
    // ========================================
    std::cout << "\n===========================================\n"
              << "  すべてのテストが完了しました\n"
              << "===========================================\n";

    return 0;
}
