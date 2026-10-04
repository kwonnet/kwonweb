import next from 'eslint-config-next';

const config = [
  ...next,
  { ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'] },
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      'react/no-unescaped-entities': 'off',
      // Next 16 enables additional React Compiler diagnostics. This application
      // has not opted into the compiler; retain these existing-code findings as
      // warnings while keeping rules-of-hooks and other correctness rules strict.
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/use-memo': 'warn',
    },
  },
];

export default config;
