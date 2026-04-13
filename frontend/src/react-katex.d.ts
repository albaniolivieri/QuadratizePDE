declare module 'react-katex' {
  import type { FC } from 'react'

  type MathProps = { math: string }

  export const InlineMath: FC<MathProps>
  export const BlockMath: FC<MathProps>
}
