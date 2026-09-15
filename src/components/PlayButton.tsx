import { forwardRef } from 'react'
import { Zap } from 'lucide-react'

interface PlayButtonProps {
  disabled: boolean
  onPress: () => void
}

export const PlayButton = forwardRef<HTMLButtonElement, PlayButtonProps>(
  function PlayButton({ disabled, onPress }, ref) {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          onClick={onPress}
          className={`play-btn play-btn-ring group relative h-32 w-32 rounded-full sm:h-36 sm:w-36 lg:h-40 lg:w-40 ${
            disabled ? '' : 'pulse-glow'
          }`}
          aria-label="Press to play"
        >
          <span className="absolute inset-[10px] rounded-full border border-white/20" />
          <span className="relative z-10 flex flex-col items-center justify-center gap-1 text-white">
            <Zap className="h-8 w-8 fill-white/90 drop-shadow sm:h-9 sm:w-9" />
            <span className="font-display text-xl leading-none tracking-[0.12em] sm:text-2xl">
              PLAY
            </span>
          </span>
        </button>
        <p className="font-display text-center text-2xl tracking-[0.18em] text-amber-200/95 sm:text-3xl">
          PRESS TO PLAY
        </p>
        <p className="max-w-[14rem] text-center text-sm text-white/55">
          Match three prizes to win · Spacebar works too
        </p>
      </div>
    )
  },
)
