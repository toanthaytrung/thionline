window.EXAM_DATA = {
  id: "k10_de02",
  title: "ĐỀ THI TOÁN KHỐI 10 - SỐ 02",
  subtitle: "Chương trình GDPT 2018 - Thời gian: 90 phút",
  durationMinutes: 90,
  unlockSolutionScore: 6.5,
  part1: [
    {
      id: 1,
      content: "Trong các mệnh đề kéo theo sau, mệnh đề nào là mệnh đề đúng?",
      options: [
        "Nếu 22 là số hữu tỉ thì 23 là hợp số.",
        "Nếu 39 là số lẻ thì 40 là số lẻ.",
        "Nếu 100 chia hết cho 10 thì 34 là số chẵn.",
        "Nếu 89 là số nguyên tố thì 26 là số lẻ."
      ],
      solution: "Mệnh đề “Nếu 100 chia hết cho 10 thì 34 là số chẵn” là khẳng định đúng."
    },
    {
      id: 2,
      content: "Phủ định của mệnh đề “94 là số nguyên” là",
      options: [
        "94 không phải là số nguyên.",
        "94 là số vô tỉ.",
        "94 không phải là số tự nhiên.",
        "94 là số nguyên tố."
      ],
      solution: "Mệnh đề phủ định của mệnh đề đã cho là “94 không phải là số nguyên”."
    },
    {
      id: 3,
      content: "Cho tập hợp $E = \\{-4; 5\\}$. Viết tập hợp $E$ dưới dạng chỉ ra tính chất đặc trưng của các phần tử.",
      options: [
        "$E = \\{x \\in \\mathbb{Z} \\mid x^2 - x - 20 = 0\\}$",
        "$E = \\{x \\in \\mathbb{Z} \\mid x^2 + 9x + 20 = 0\\}$",
        "$E = \\{x \\in \\mathbb{Z} \\mid x^2 - 9x + 20 = 0\\}$",
        "$E = \\{x \\in \\mathbb{N} \\mid x^2 + x - 20 = 0\\}$"
      ],
      solution: "Ta có: $x^2 - x - 20 = 0 \\Leftrightarrow x = -4$ hoặc $x = 5$. Do đó: $E = \\{x \\in \\mathbb{Z} \\mid x^2 - x - 20 = 0\\}$."
    },
    {
      id: 4,
      content: "Liệt kê các phần tử của tập hợp $A = \\{x \\in \\mathbb{N} \\mid x < 30,\\, x \\text{ là bội của } 5\\}$.",
      options: [
        "$\\{5; 15; 25\\}$",
        "$\\{0; 1; 2; 3; 4\\}$",
        "$\\{0; 5; 10; 15; 20; 25\\}$",
        "$\\{1; 5\\}$"
      ],
      solution: "Bội của 5 và nhỏ hơn 30 thuộc $\\mathbb{N}$ là $\\{0; 5; 10; 15; 20; 25\\}$."
    },
    {
      id: 5,
      content: "Cho các tập hợp $B = \\{5; -2\\}$, $D = \\{5; x\\}$, $H = \\{y; -2\\}$. Giá trị của $x, y$ để ba tập hợp bằng nhau là",
      options: [
        "$x = -2,\\, y = 5$",
        "$x = -4,\\, y = 5$",
        "$x = -2,\\, y = 4$",
        "$x = -1,\\, y = 5$"
      ],
      solution: "Ba tập hợp bằng nhau khi chúng có cùng các phần tử. $B = D = H \\Leftrightarrow x = -2,\\, y = 5$."
    },
    {
      id: 6,
      content: "Cho hai tập hợp $A = \\{-6; 3; 4; -3\\}$ và $B = \\{0; 5; -9; -4; -1\\}$. Tìm tập hợp $A \\cap B$.",
      options: [
        "$\\{-6; 3; 4; -3\\}$",
        "$\\{0; 5; -9; -4; -1\\}$",
        "$\\{0; 3; 4; 5; -9; -6; -4; -3; -1\\}$",
        "$\\varnothing$"
      ],
      solution: "Hai tập hợp không có phần tử chung nào nên $A \\cap B = \\varnothing$."
    },
    {
      id: 7,
      content: "Cho hai tập hợp $E = \\{1; 4; 7; -1; -9; -4; -2\\}$ và $F = \\{1; 4; 7; -9; -4; -1\\}$. Tìm tập hợp $C_E F$.",
      options: [
        "$\\varnothing$",
        "$\\{1; 4; 7; -9; -4; -1\\}$",
        "$\\{-2\\}$",
        "$\\{1; 4; 7; -1; -9; -4; -2\\}$"
      ],
      solution: "Do $F \\subset E$ nên $C_E F = E \\setminus F = \\{-2\\}$."
    },
    {
      id: 8,
      content: "Cho hai tập hợp $N$ và $B$ biết $n(N) = 28$, $n(N \\cap B) = 14$, $n(N \\cup B) = 46$. Tính $n(B)$.",
      options: [
        "48",
        "32",
        "18",
        "14"
      ],
      solution: "Áp dụng công thức: $n(B) = n(N \\cup B) + n(N \\cap B) - n(N) = 46 + 14 - 28 = 32$."
    },
    {
      id: 9,
      content: "Cho hai tập hợp $C = (-2; 7)$, $X = (-1; 3]$. Khi đó $C_C X$ là tập nào sau đây?",
      options: [
        "$C_C X = (-2; -1] \\cup (3; 7)$",
        "$C_C X = (-2; -1) \\cup [3; 7)$",
        "$C_C X = (3; 7)$",
        "$C_C X = (-2; -1]$"
      ],
      solution: "Vì $X \\subset C$ nên $C_C X = C \\setminus X = (-2; -1] \\cup (3; 7)$."
    },
    {
      id: 10,
      content: "Cho tập hợp $F = \\{x \\in \\mathbb{R} \\mid 4 - 7x \\ge 7 - 5x\\}$. Hãy viết lại tập hợp $F$ bằng kí hiệu khoảng, đoạn, nửa khoảng.",
      options: [
        "$F = \\left(-\\frac{3}{2}; +\\infty\\right)$",
        "$F = \\left(-\\infty; -\\frac{3}{2}\\right]$",
        "$F = \\left(-\\infty; -\\frac{3}{2}\\right)$",
        "$F = \\left[-\\frac{3}{2}; +\\infty\\right)$"
      ],
      solution: "Ta có: $4 - 7x \\ge 7 - 5x \\Leftrightarrow -2x \\ge 3 \\Leftrightarrow x \\le -\\frac{3}{2}$. Do đó $F = \\left(-\\infty; -\\frac{3}{2}\\right]$."
    },
    {
      id: 11,
      content: "Cho hai tập hợp $C = \\{x \\in \\mathbb{R} \\mid -9 \\le x < 0\\}$ và $N = \\{x \\in \\mathbb{R} \\mid -4 < x \\le 8\\}$. Tập hợp $C \\setminus N$ là",
      options: [
        "$C \\setminus N = [-9; -4]$",
        "$C \\setminus N = [-4; 0)$",
        "$C \\setminus N = [-9; -4)$",
        "$C \\setminus N = [-4; 8]$"
      ],
      solution: "Ta có: $C = [-9; 0)$ và $N = (-4; 8]$. Suy ra $C \\setminus N = [-9; -4]$."
    },
    {
      id: 12,
      content: "Cho hai tập hợp $E = \\{x \\in \\mathbb{R} \\mid 3 < x < 9\\}$ và $A = \\{x \\in \\mathbb{R} \\mid 7 < x < 10\\}$. Tập hợp $E \\cap A$ là",
      options: [
        "$E \\cap A = (7; 9)$",
        "$E \\cap A = (9; 10)$",
        "$E \\cap A = (3; 9)$",
        "$E \\cap A = (3; 7)$"
      ],
      solution: "Ta có: $E = (3; 9)$ và $A = (7; 10)$. Suy ra $E \\cap A = (7; 9)$."
    }
  ],
  part2: [
    {
      id: 1,
      content: "Cho $P(n) = -2n^2 - 8n - 11$ với $n$ là số nguyên. Xét tính đúng-sai của các khẳng định sau:",
      items: [
        {
          key: "a",
          text: "$P(-3)$ không phải là số dương."
        },
        {
          key: "b",
          text: "$P(6) \\le 0$."
        },
        {
          key: "c",
          text: "$P(3a) - P(a) = -16a^2 - 16a$."
        },
        {
          key: "d",
          text: "Số các số nguyên $n$ để $\\frac{P(n) - 1}{n + 2}$ là số nguyên là 6."
        }
      ],
      solution: "<b>a) Đúng:</b> $P(-3) = -2(-3)^2 - 8(-3) - 11 = -5 < 0$.<br><b>b) Đúng:</b> $P(6) = -131 \\le 0$.<br><b>c) Đúng:</b> $P(3a) - P(a) = -18a^2 - 24a - 11 - (-2a^2 - 8a - 11) = -16a^2 - 16a$.<br><b>d) Đúng:</b> $\\frac{P(n) - 1}{n + 2} = -2(n + 2) + \\frac{-4}{n + 2}$. Biểu thức nguyên khi $n + 2 \\in \\{\\pm 1; \\pm 2; \\pm 4\\} \\Rightarrow n \\in \\{-3; -1; -4; 0; -6; 2\\}$ (có 6 số nguyên)."
    },
    {
      id: 2,
      content: "Xét tính đúng-sai của các khẳng định sau:",
      items: [
        {
          key: "a",
          text: "Tập hợp $A = \\{x \\in \\mathbb{Z} \\mid 1 \\le x \\le 10\\}$ có số phần tử là 9."
        },
        {
          key: "b",
          text: "Tập hợp $B = \\{x \\in \\mathbb{R} \\mid 2x^2 - 16x + 32 = 0\\}$ có 1 phần tử."
        },
        {
          key: "c",
          text: "Tập hợp $C = \\{x \\in \\mathbb{Q} \\mid (x + \\sqrt{13})(x^2 - 4) = 0\\}$ có 2 phần tử."
        },
        {
          key: "d",
          text: "Tập hợp $D = \\{n \\in \\mathbb{N} \\mid 4 - 3n < 2 - 2n < 11 - 3n\\}$ có 7 phần tử."
        }
      ],
      solution: "<b>a) Sai:</b> $A = \\{1; 2; \\dots; 10\\}$ có 10 phần tử.<br><b>b) Đúng:</b> $2x^2 - 16x + 32 = 0 \\Leftrightarrow x = 4$, tập có 1 phần tử.<br><b>c) Đúng:</b> $(x + \\sqrt{13})(x^2 - 4) = 0 \\Rightarrow x = \\pm 2 \\in \\mathbb{Q}$ ($x = -\\sqrt{13} \\notin \\mathbb{Q}$), tập có 2 phần tử.<br><b>d) Sai:</b> $4 - 3n < 2 - 2n < 11 - 3n \\Leftrightarrow 2 < n < 9 \\Rightarrow n \\in \\{3; 4; 5; 6; 7; 8\\}$, tập có 6 phần tử."
    },
    {
      id: 3,
      content: "Cho 3 tập hợp $A = \\{7; 16; 17; 20; 21; 23\\}$, $B = \\{16; 17; 20; 23\\}$ và $E = \\{7; 16; 17; 20; 21; 23; 26\\}$. Xét tính đúng-sai của các khẳng định sau:",
      items: [
        {
          key: "a",
          text: "Tập $A$ có 7 phần tử."
        },
        {
          key: "b",
          text: "Tập $B \\cup A$ có 6 phần tử."
        },
        {
          key: "c",
          text: "Số tập hợp con của tập hợp $B$ là 16."
        },
        {
          key: "d",
          text: "Có 2 tập hợp $X \\subset E$ sao cho $A \\cap X = B$."
        }
      ],
      solution: "<b>a) Sai:</b> Tập $A$ có 6 phần tử.<br><b>b) Đúng:</b> Vì $B \\subset A$ nên $B \\cup A = A$, có 6 phần tử.<br><b>c) Đúng:</b> Tập $B$ có 4 phần tử nên số tập con là $2^4 = 16$.<br><b>d) Đúng:</b> $A \\cap X = B$ đòi hỏi $X$ chứa toàn bộ $B$, không chứa phần tử nào thuộc $A \\setminus B = \\{7; 21\\}$, và có thể chứa hoặc không chứa phần tử $26 \\in E \\setminus A$. Có $2^1 = 2$ tập hợp thỏa mãn."
    },
    {
      id: 4,
      content: "Cho $A = (-7; 7)$, $B = (-3; 7]$. Xét tính đúng-sai của các khẳng định sau:",
      items: [
        {
          key: "a",
          text: "$A \\cap B = [-3; 7]$."
        },
        {
          key: "b",
          text: "$A \\cup B = (-7; 7]$."
        },
        {
          key: "c",
          text: "$A \\setminus B = (-7; -3]$."
        },
        {
          key: "d",
          text: "$C_\\mathbb{R} B = (-\\infty; -3) \\cup (7; +\\infty)$."
        }
      ],
      solution: "<b>a) Sai:</b> $A \\cap B = (-3; 7)$.<br><b>b) Đúng:</b> $A \\cup B = (-7; 7]$.<br><b>c) Đúng:</b> $A \\setminus B = (-7; -3]$.<br><b>d) Sai:</b> $C_\\mathbb{R} B = (-\\infty; -3] \\cup (7; +\\infty)$."
    }
  ],
  part3: [
    {
      id: 1,
      content: "Số phần tử của tập hợp $H = \\{n \\in \\mathbb{N} \\mid |n + 20| < 133\\}$ là bao nhiêu?",
      solution: "Đáp án: 113<br>Ta có $|n + 20| < 133 \\Leftrightarrow -153 < n < 113$. Vì $n \\in \\mathbb{N}$ nên $n \\in \\{0; 1; 2; \\dots; 112\\}$, có 113 phần tử."
    },
    {
      id: 2,
      content: "Số phần tử của tập hợp $E = \\left\\{x \\in \\mathbb{Q} \\;\\middle|\\; x = \\frac{1}{2^n},\\, n \\in \\mathbb{N},\\, x \\ge \\frac{1}{8}\\right\\}$ là bao nhiêu?",
      solution: "Đáp án: 4<br>Ta có $\\frac{1}{2^n} \\ge \\frac{1}{8} = \\frac{1}{2^3} \\Leftrightarrow n \\le 3$. Vì $n \\in \\mathbb{N}$ nên $n \\in \\{0; 1; 2; 3\\}$, có 4 phần tử."
    },
    {
      id: 3,
      content: "Lớp 10B9 có tổng cộng 38 học sinh, các học sinh này đều thích xem phim rạp hoặc thích xem ca nhạc. Có 24 học sinh thích xem phim rạp và 22 học sinh thích xem ca nhạc. Hỏi lớp 10B9 có bao nhiêu học sinh thích cả xem phim rạp và thích xem ca nhạc?",
      solution: "Đáp án: 8<br>Số học sinh thích cả hai là: $24 + 22 - 38 = 8$."
    },
    {
      id: 4,
      content: "Cho hai tập hợp $G = [1; 15)$ và $E = [3; 19)$. Tìm số phần tử là số nguyên thuộc tập hợp $G \\cap E$.",
      solution: "Đáp án: 12<br>Ta có $G \\cap E = [3; 15)$. Các số nguyên thuộc tập hợp là $\\{3; 4; \\dots; 14\\}$, gồm $14 - 3 + 1 = 12$ phần tử."
    },
    {
      id: 5,
      content: "Cho hai tập hợp $M = [m; m + 7]$ và $D = \\{x \\in \\mathbb{R} \\mid -9 < x - 9 < -1\\}$. Biết rằng với $m \\le a$ hoặc $m \\ge b$ thì tập hợp $M \\cap D$ là tập rỗng. Tính $P = 4a + 5b$ (kết quả làm tròn đến hàng phần mười).",
      solution: "Đáp án: 12<br>Ta có $-9 < x - 9 < -1 \\Leftrightarrow 0 < x < 8 \\Rightarrow D = (0; 8)$. Để $M \\cap D = \\varnothing$ thì $m + 7 \\le 0$ hoặc $m \\ge 8 \\Leftrightarrow m \\le -7$ hoặc $m \\ge 8$. Suy ra $a = -7, b = 8$. Do đó $P = 4(-7) + 5(8) = 12$."
    },
    {
      id: 6,
      content: "Mỗi học sinh của lớp 10A8 đều thích các môn Tự nhiên hoặc thích các môn Xã hội. Biết rằng lớp có 19 bạn thích các môn Tự nhiên, có 23 bạn thích các môn Xã hội và có 10 bạn thích cả hai môn Tự nhiên và Xã hội. Hỏi lớp 10A8 có tổng cộng bao nhiêu học sinh?",
      solution: "Đáp án: 32<br>Tổng số học sinh lớp 10A8 là: $19 + 23 - 10 = 32$."
    }
  ],
  answerKey: {
    p1: {
      "1": "C", "2": "A", "3": "A", "4": "C", "5": "A", "6": "D",
      "7": "C", "8": "B", "9": "A", "10": "B", "11": "A", "12": "A"
    },
    p2: {
      "1": { "a": "Đ", "b": "Đ", "c": "Đ", "d": "Đ" },
      "2": { "a": "S", "b": "Đ", "c": "Đ", "d": "S" },
      "3": { "a": "S", "b": "Đ", "c": "Đ", "d": "Đ" },
      "4": { "a": "S", "b": "Đ", "c": "Đ", "d": "S" }
    },
    p3: {
      "1": "113",
      "2": "4",
      "3": "8",
      "4": "12",
      "5": "12",
      "6": "32"
    }
  }
};
