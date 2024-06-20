/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import axios, {AxiosResponse} from "axios";
import {Market} from "@/types/market";
import {Token} from "@/types/tokens";
import {defaultChain} from "@/queries/constants";
import {getLiquidityAndVolume, getOutcomeTokensPercent} from "@/queries/market";

const app = new Frog({
  assetsPath: '/',
  basePath: '/markets',
})

const limitlessApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame('/:address', async (c) => {
    const marketAddress = c.req.param('address')
    const { buttonValue, inputText, status, deriveState } = c
    const fruit = inputText || buttonValue
    const marketResponse: AxiosResponse<Market> = await limitlessApi.get(`/markets/${marketAddress}`)
    const tokensResponse: AxiosResponse<Token[]> = await limitlessApi.get('/tokens')
    const collateralToken = tokensResponse.data.find((token) => token.address === marketResponse.data.collateralToken[defaultChain.id]) as Token
    const {liquidity, volume} = await getLiquidityAndVolume(marketAddress, collateralToken)
    const outcomeTokensPercent = await getOutcomeTokensPercent(marketResponse.data, collateralToken)

  return c.res({
    image: (
        <div style={{color: 'black', display: 'flex', fontSize: 60, backgroundColor: 'white', height: '100%', padding: '8px', maxWidth: '100%'}}>
            <div style={{ display: 'flex', gap: '16px' }}>
                <img src={marketResponse.data.imageURI} alt="market" style={{
                    maxWidth: '400px',
                    maxHeight: '400px',
                    borderRadius: '12px',
                }}/>
                <div style={{display: 'flex', flex: 1, flexDirection: 'column'}}>
                    <span style={{fontSize: '40px', fontWeight: 'bold'}}>{marketResponse.data.title}</span>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '12px', maxWidth: '90%'}}>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span style={{fontSize: '32px', fontWeight: 800, color: '#747675'}}>Liquidity</span>
                            <span style={{fontSize: '28px'}}>{liquidity} {collateralToken.symbol}</span>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span style={{fontSize: '32px', fontWeight: 800, color: '#747675'}}>Volume</span>
                            <span style={{fontSize: '28px'}}>{volume} {collateralToken.symbol}</span>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span style={{fontSize: '32px', fontWeight: 800, color: '#747675'}}>Deadline</span>
                            <span style={{fontSize: '28px'}}>{marketResponse.data.expirationDate}</span>
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
          <TextInput placeholder={`Enter amount ${marketResponse.data.tokenTicker[defaultChain.id]}`}/>,
          <Button value=''>Yes {outcomeTokensPercent[0]}%</Button>,
          <Button value={`${'No 50.00%'}`}>No {outcomeTokensPercent[1]}%</Button>,
          status === 'response' && <Button.Reset>Reset</Button.Reset>,
      ],
  })
})

devtools(app, {serveStatic})

export const GET = handle(app)
export const POST = handle(app)
