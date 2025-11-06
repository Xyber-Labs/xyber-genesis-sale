import * as assert from "assert";
import * as anchor from "@coral-xyz/anchor";

export function checkAnchorError(error: any, errMsg: string) {
  if (error instanceof anchor.AnchorError) {
    assert.equal((error as anchor.AnchorError).error.errorMessage, errMsg);
  } else if (error.message && error.message.includes(errMsg)) {
    return;
  } else {
    assert.fail(`Expected error message containing "${errMsg}", got: ${error.message || error}`);
  }
}

export async function doAndCheckError(promise: Promise<any>, errMsg: string) {
  try {
    await promise;
    assert.fail(`Should have failed with error: ${errMsg}`);
  } catch (error: any) {
    checkAnchorError(error, errMsg);
  }
}
