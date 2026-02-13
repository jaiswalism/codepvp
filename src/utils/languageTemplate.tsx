export const LANGUAGES = {
  python: {
    id: 71,
    template: `import sys

def main():
    # type your code here
    pass

if __name__ == "__main__":
    main()
`
  },

  cpp: {
    id: 12,
    template: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    // type your code here

    return 0;
}
`
  },

  java: {
    id: 25,
    template: `import java.util.*;

public class Main {
    public static void main(String[] args) {

        // type your code here

    }
}
`
  },

  javascript: {
    id: 26,
    template: `'use strict';

process.stdin.resume();
process.stdin.setEncoding('utf-8');

let input = '';

process.stdin.on('data', chunk => {
    input += chunk;
});

process.stdin.on('end', () => {

    // type your code here

});
`
  },

  typescript: {
    id: 45,
    template: `process.stdin.resume();
process.stdin.setEncoding('utf-8');

let input: string = '';

process.stdin.on('data', chunk => {
    input += chunk;
});

process.stdin.on('end', () => {

    // type your code here

});
`
  },

  go: {
    id: 22,
    template: `package main

import "fmt"

func main() {

    // type your code here

}
`
  },

  rust: {
    id: 41,
    template: `fn main() {

    // type your code here

}
`
  }
} as const;
