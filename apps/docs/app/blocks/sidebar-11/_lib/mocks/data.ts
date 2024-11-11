export interface Change {
  file: string;
  state: 'M' | 'U' | 'A' | 'D'; // M for Modified, U for Untracked, A for Added, D for Deleted
}

export type TreeNode = string | [string, ...TreeNode[]];

export interface Data {
  changes: Change[];
  tree: TreeNode[];
}

export const data: Data = {
  changes: [
    {
      file: 'README.md',
      state: 'M',
    },
    {
      file: 'api/hello/route.ts',
      state: 'U',
    },
    {
      file: 'app/layout.tsx',
      state: 'M',
    },
  ],
  tree: [
    ['app', ['api', ['hello', ['route.ts']], 'page.tsx', 'layout.tsx', ['blog', ['page.tsx']]]],
    ['components', ['ui', 'button.tsx', 'card.tsx'], 'header.tsx', 'footer.tsx'],
    ['lib', ['util.ts']],
    ['public', 'favicon.ico', 'vercel.svg'],
    '.eslintrc.json',
    '.gitignore',
    'next.config.js',
    'tailwind.config.js',
    'package.json',
    'README.md',
  ],
};
