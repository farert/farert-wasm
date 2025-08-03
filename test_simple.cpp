#include <emscripten.h>
#include <cstdio>

extern "C" {

EMSCRIPTEN_KEEPALIVE
int test_simple() {
    printf("Simple WASM test works!\n");
    return 42;
}

EMSCRIPTEN_KEEPALIVE
int add_numbers(int a, int b) {
    return a + b;
}

}