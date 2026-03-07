export function getEnvVar(varValue: string | undefined, varName: string): string {
  if (varValue === undefined) {
    console.error(`[getEnvVar] Missing required env var: ${varName}`);
    throw new ReferenceError(`Reference to undefined env var: ${varName}`);
  }
  return varValue;
}
