import path from 'path';

/**
 * Derive a safe sibling ROM output path based on an input ROM path.
 * - Preserves .sfc or .smc extensions; defaults to .smc otherwise.
 * - Appends the provided suffix to the basename.
 * - Ensures the output never equals the input; if it would, appends `_fixed`.
 */
export function deriveRomOutputPath(inputPath: string, suffix: string): string {
  const parsed = path.parse(inputPath);
  const extLower = parsed.ext.toLowerCase();
  const outExt = extLower === '.sfc' || extLower === '.smc' ? parsed.ext : '.smc';
  const candidate = path.join(parsed.dir, `${parsed.name}${suffix}${outExt}`);
  if (path.resolve(candidate) === path.resolve(inputPath)) {
    return path.join(parsed.dir, `${parsed.name}${suffix}_fixed${outExt}`);
  }
  return candidate;
}

