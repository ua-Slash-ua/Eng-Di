/** True while `next build` is collecting page data / generating static output. */
export function isNextProductionBuild(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}
