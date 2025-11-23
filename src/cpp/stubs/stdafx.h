// stdafx.h - Dummy precompiled header for non-Windows platforms
// This file provides compatibility for Windows-specific code

#pragma once

// Emscripten/WASM environment
#ifdef __EMSCRIPTEN__

// Common C++ headers that would normally be in stdafx.h
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cstdint>
#include <cassert>
#include <cstdarg>
#include <string>
#include <vector>
#include <map>
#include <algorithm>
#include <memory>
#include <iostream>
#include <sstream>
#include <fstream>

// Forward declare to avoid circular dependencies
// Windows types must be defined before including db.h

// Windows types compatibility
#ifndef _WINDOWS

// Basic Windows types
typedef const char* LPCTSTR;
typedef char* LPTSTR;
typedef unsigned long DWORD;
typedef int BOOL;
typedef unsigned char BYTE;
typedef char TCHAR;

// Boolean constants
#ifndef TRUE
#define TRUE 1
#endif
#ifndef FALSE
#define FALSE 0
#endif

// Text macros - for UTF-8, just pass through
#ifndef _T
#define _T(x) x
#endif

// String types
// In Windows, tstring is std::wstring (Unicode) or std::string (ANSI)
// For WASM/Emscripten, we use UTF-8 strings (std::string)
typedef std::string tstring;

// Debug macros
#ifdef _DEBUG
#define ASSERT(x) assert(x)
#define TRACE(...) printf(__VA_ARGS__)
#else
#define ASSERT(x) ((void)0)
#define TRACE(...) ((void)0)
#endif

// Microsoft-specific secure string functions replacement
// Note: Original code uses 3-argument form: _sntprintf_s(buffer, size, format, ...)
#ifndef _sntprintf_s
inline int _sntprintf_s(char* buffer, size_t sizeOfBuffer, const char* format, ...) {
    va_list args;
    va_start(args, format);
    int result = vsnprintf(buffer, sizeOfBuffer, format, args);
    va_end(args);
    return result;
}
#endif

// Windows string manipulation functions
#ifndef _tcscpy_s
inline int _tcscpy_s(char* dest, size_t destSize, const char* src) {
    strncpy(dest, src, destSize - 1);
    dest[destSize - 1] = '\0';
    return 0;
}
#endif

#ifndef _tcscat_s
inline int _tcscat_s(char* dest, size_t destSize, const char* src) {
    size_t destLen = strlen(dest);
    if (destLen < destSize) {
        strncpy(dest + destLen, src, destSize - destLen - 1);
        dest[destSize - 1] = '\0';
    }
    return 0;
}
#endif

#ifndef _tcslen
#define _tcslen strlen
#endif

#ifndef _tcsncmp
#define _tcsncmp strncmp
#endif

#ifndef _tcstok_s
inline char* _tcstok_s(char* str, const char* delimiters, char** context) {
    return strtok_r(str, delimiters, context);
}
#endif

#endif // _WINDOWS

// Include db.h to make DBO and DBS classes available to alpdb.h
// alpdb.h includes stdafx.h but not db.h, so we include it here
#include "../core/db.h"


#endif // __EMSCRIPTEN__
