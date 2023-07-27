import { expect } from 'chai'
import Sinon from 'sinon'
import browser from 'sinon-chrome'
import { generateAddRule } from '../../add-on/src/lib/redirect-handler/blockOrObserve'
import isManifestV3 from './is-mv3-testing-enabled'

export const regexRuleEnding = '((?:[^\\.]|$).*)$'

/**
 * Ensure that the request is redirected
 *
 * @param modifiedRequestCallResp - Response from onBeforeRequest or onHeadersReceived
 * @param MV2Expectation - Expected redirect URL for Manifest V2
 * @param MV3Expectation - Expected redirect URL for Manifest V3
 * @param MV3Expectation.origin - Expected origin URL for Manifest V3
 * @param MV3Expectation.destination - Expected destination URL for Manifest V3
 */
export function ensureCallRedirected ({
  modifiedRequestCallResp,
  MV2Expectation,
  MV3Expectation
}: {
  modifiedRequestCallResp: { redirectUrl: string },
  MV2Expectation: string,
  MV3Expectation: {
    origin: string,
    destination: string
  }
}): void {
  if (isManifestV3) {
    const [args] = browser.declarativeNetRequest.updateDynamicRules.firstCall.args
    expect(args.addRules[0]).to.deep.equal(generateAddRule(
      args.addRules[0].id,
      MV3Expectation.origin + regexRuleEnding,
      MV3Expectation.destination + '\\1'
    ))
  } else {
    expect(modifiedRequestCallResp.redirectUrl).to.equal(MV2Expectation)
  }
}

/**
 * Ensure that the request is not touched
 *
 * @param resp - Response from onBeforeRequest or onHeadersReceived
 */
export function ensureRequestUntouched (resp): void {
  if (isManifestV3) {
    Sinon.assert.notCalled(browser.declarativeNetRequest.updateDynamicRules)
  } else {
    expect(resp).to.equal(undefined)
  }
}

/**
 * Ensure that the request is not redirected
 *
 * @param modifyRequest - Request Modifier
 * @param request - Request to be modified
 */
export async function ensureNoRedirect (modifyRequest, request): Promise<void> {
  await Promise.all([
    modifyRequest.onBeforeRequest(request),
    modifyRequest.onHeadersReceived(request)
  ].map(async (resp) => {
    await ensureRequestUntouched(await resp)
  }))
}
