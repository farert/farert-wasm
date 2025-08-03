#ifndef FARERT_COMMON_H
#define FARERT_COMMON_H

#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>
#include <map>

// Type definitions for cross-platform compatibility
typedef std::string tstring;
typedef const char* LPCTSTR;
typedef char* LPTSTR;
typedef char* LPSTR;
typedef char TCHAR;
typedef unsigned char BYTE;

// Basic constants
#ifndef FALSE
#define FALSE   false
#endif
#ifndef TRUE
#define TRUE    true
#endif

// Tax rate - convert from global variable to define
#define TAX 10

// Debug and tracing macros
#ifdef DEBUG
#define TRACE printf
#define ASSERT(cond) if (!(cond)) { \
    fprintf(stderr, "\n\nAssertion error: %s:%d\n\n", __FILE__, __LINE__); \
    abort(); }
#else
#define TRACE(...)
#define ASSERT(cond)
#endif

// String utility macros (UTF-8 only)
#define _T(x) x
#define _ftprintf fprintf
#define _tcschr strchr
#define _tfopen fopen
#define _tcscpy strcpy
#define _tcsncmp strncmp
#define _tcstok_s strtok_r
#define _tcscat_s strcat_s
#define _tcscpy_s strcpy_s
#define _tcslen strlen
#define _sntprintf_s snprintf
#define sprintf_s snprintf

// Safe string functions
char* strcpy_s(char* dst, size_t maxlen, const char* src);
char* strcat_s(char* dst, size_t maxlen, const char* src);

// Forward declarations - SQLite3 will be included by specific files that need it

#endif // FARERT_COMMON_H