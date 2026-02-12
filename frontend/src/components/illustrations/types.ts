export interface IllustrationProps {
  /** Width/height in px (square). Default varies by category. */
  size?: number
  className?: string
  /** Disable entrance animation */
  static?: boolean
}

export interface PatternProps {
  density?: 'sparse' | 'normal' | 'dense'
  /** 0-1, default ~0.15 */
  opacity?: number
  className?: string
}
