/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import {Market} from "@/types/market";
import {Token} from "@/types/tokens";
import {defaultChain} from "@/queries/constants";
import {getLiquidityAndVolume, getOutcomeTokensPercent} from "@/queries/market";

const app = new Frog({
  assetsPath: '/',
  basePath: '/markets',
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame('/:address', async (c) => {
    const marketAddress = c.req.param('address')
    const { buttonValue, inputText, status, deriveState } = c
    const marketData = await fetch(`https://dev.api.limitless.exchange/markets/${marketAddress}`, {
        method: 'GET'
    })
    const marketResponse = await marketData.json()
    const tokeData = await fetch('https://dev.api.limitless.exchange/tokens', {
        method: 'GET'
    })
    const tokensResponse: Token[] = await tokeData.json()

    const collateralToken = tokensResponse.find((token) => token.address.toLowerCase() === marketResponse.collateralToken[defaultChain.id].toLowerCase()) as Token
    const outcomeTokensPercent = await getOutcomeTokensPercent(marketResponse, collateralToken)


  return c.res({
    image: (
        <div style={{color: 'black', display: 'flex', fontSize: 60, backgroundColor: 'white', height: '100%', padding: '8px', maxWidth: '100%'}}>
            <div style={{ display: 'flex', gap: '16px' }}>
                <img src={marketResponse.imageURI} alt="market" style={{
                    maxWidth: '400px',
                    maxHeight: '400px',
                    borderRadius: '12px',
                }}/>
                <div style={{display: 'flex', flex: 1, flexDirection: 'column'}}>
                    <span style={{fontSize: '40px', fontWeight: 'bold'}}>{marketResponse.title}</span>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '12px', maxWidth: '90%'}}>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span style={{fontSize: '32px', fontWeight: 800, color: '#747675'}}>Deadline</span>
                            <span style={{fontSize: '28px'}}>{marketResponse.expirationDate}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', color: 'black' }}>
                asd
            </div>
        </div>
    ),
      intents: [
          <TextInput placeholder={`Enter amount `}/>,
          <Button value=''>Yes {outcomeTokensPercent[0]}%</Button>,
          <Button value={`${'No 50.00%'}`}>No {outcomeTokensPercent[1]}%</Button>,
      ],
  })
})

devtools(app, {serveStatic})

export const GET = handle(app)
export const POST = handle(app)
