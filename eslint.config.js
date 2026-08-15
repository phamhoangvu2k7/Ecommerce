import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'no-alert': 'off',
    'unused-imports/no-unused-vars': 'off',
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
  },
})

