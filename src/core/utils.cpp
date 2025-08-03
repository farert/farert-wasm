#include "../include/common.h"

// Safe string functions implementation
char* strcpy_s(char* dst, size_t maxlen, const char* src) {
    size_t len = strlen(src);
    if (maxlen <= len) {
        len = maxlen - 1;
        strncpy(dst, src, len);
        dst[len] = '\0';
    } else {
        strcpy(dst, src);
    }
    return dst;
}

char* strcat_s(char* dst, size_t maxlen, const char* src) {
    size_t src_len = strlen(src);
    size_t dst_len = strlen(dst);
    
    if (maxlen < dst_len) {
        ASSERT(false);
        return dst;
    }
    
    if (maxlen <= (src_len + dst_len)) {
        src_len = maxlen - dst_len - 1;
        strncat(dst, src, src_len);
        dst[dst_len + src_len] = '\0';
    } else {
        strcat(dst, src);
    }
    return dst;
}