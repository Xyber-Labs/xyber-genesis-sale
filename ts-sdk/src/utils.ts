export function getConstantRaw(
  name: string,
  idl: { constants?: [{ name: string; value: any }] }
): any {
  if (!idl.constants) {
    throw new Error(`IDL does not contain constants section`);
  }

  const constant = idl.constants.find(
    (obj: { name: string }) => obj.name === name
  );

  if (!constant) {
    throw new Error(
      `Constant "${name}" not found in IDL. Available constants: ${idl.constants
        .map((c) => c.name)
        .join(", ")}`
    );
  }

  return JSON.parse(constant.value);
}

export function getConstant(
  name: string,
  idl: { constants?: [{ name: string; value: any }] }
): Uint8Array {
  const value = getConstantRaw(name, idl);
  return new Uint8Array(value);
}

export function parseRound(round: any): string {
  const keys = ["public"];
  for (const key of keys) {
    if (key in round) {
      return key.toUpperCase();
    }
  }
  throw new Error(`Invalid round: ${JSON.stringify(round)}`);
}

export function getRound(roundName: string): any {
  switch (roundName.toLowerCase()) {
    case "public":
      return { public: {} };
    default:
      console.error("Failed to parse round: ", roundName);
      process.exit(1);
  }
}
