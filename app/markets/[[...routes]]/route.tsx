/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import {Token} from "@/types/tokens";
import {defaultChain} from "@/queries/constants";
import {getLiquidityAndVolume, getOutcomeTokensPercent, getQuote} from "@/queries/market";

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
    const {liquidity, volume} = await getLiquidityAndVolume(marketAddress, collateralToken)

    const getIntents = () => {
        if(!buttonValue || !inputText) {
            return [
                <TextInput placeholder={`Enter amount ${collateralToken.symbol}`}/>,
                <Button value='buyYes'>Yes {outcomeTokensPercent[0].toString()}%</Button>,
                <Button value='buyNo'>No {outcomeTokensPercent[1].toString()}%</Button>,
            ]
        }
        return [
            <Button>Proceed</Button>
        ]
    }

    const getImage = async () => {
        if(inputText) {
            const values = await getQuote(marketResponse, inputText, collateralToken, buttonValue === 'buyYes' ? 0: 1, outcomeTokensPercent)
            return (
                <div style={{
                    color: 'black',
                    display: 'flex',
                    fontSize: 60,
                    backgroundColor: 'white',
                    height: '100%',
                    padding: '8px',
                    maxWidth: '100%'
                }}>
                    <div style={{display: 'flex', gap: '16px'}}>
                        <img src={marketResponse.imageURI} alt="market" style={{
                            maxWidth: '400px',
                            maxHeight: '400px',
                            borderRadius: '12px',
                        }}/>
                        <div style={{display: 'flex', flex: 1, flexDirection: 'column'}}>
                            <span style={{fontSize: '40px', fontWeight: 'bold'}}>{marketResponse.title}</span>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '12px',
                                maxWidth: '90%'
                            }}>
                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <span
                                        style={{fontSize: '32px', fontWeight: 800, color: '#747675'}}>Avg. Price</span>
                                    <span style={{fontSize: '28px'}}>{values ? (+values.outcomeTokenPrice).toFixed(6) : 0} {collateralToken.symbol}</span>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <span style={{
                                        fontSize: '32px',
                                        fontWeight: 800,
                                        color: '#747675'
                                    }}>Price Impact</span>
                                    <span style={{fontSize: '28px'}}>{0.01}%</span>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <span style={{
                                        fontSize: '32px',
                                        fontWeight: 800,
                                        color: '#747675'
                                    }}>Potential Return</span>
                                    <span style={{fontSize: '28px'}}>{values ? (+values.outcomeTokenAmount).toFixed(6) : 0} {collateralToken.symbol}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        return (
            <div style={{
                color: 'black',
                display: 'flex',
                fontSize: 60,
                backgroundColor: 'white',
                height: '100%',
                padding: '8px',
                maxWidth: '100%'
            }}>
                <div style={{display: 'flex', gap: '16px'}}>
                    <img src={marketResponse.imageURI} alt="market" style={{
                        maxWidth: '400px',
                        maxHeight: '400px',
                        borderRadius: '12px',
                    }}/>
                    <div style={{display: 'flex', flex: 1, flexDirection: 'column'}}>
                        <span style={{fontSize: '40px', fontWeight: 'bold'}}>{marketResponse.title}</span>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '12px',
                            maxWidth: '90%'
                        }}>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <span style={{fontSize: '32px', fontWeight: 800, color: '#747675'}}>Liquidity</span>
                                <span style={{fontSize: '28px'}}>{liquidity} {collateralToken.symbol}</span>
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <span style={{
                                        fontSize: '32px',
                                        fontWeight: 800,
                                        color: '#747675'
                                    }}>Volume</span>
                                <span
                                    style={{fontSize: '28px'}}>{volume} {collateralToken.symbol}</span>
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <span style={{
                                        fontSize: '32px',
                                        fontWeight: 800,
                                        color: '#747675'
                                    }}>Deadline</span>
                                <span style={{fontSize: '28px'}}>{marketResponse.expirationDate}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{display: 'flex', color: 'black'}}>
                    asd
                </div>
            </div>
        )
    }


    return c.res({
        image: getImage(),
        intents: getIntents(),
    })
})

// app.frame('/buyYes', async (c) => {
//     return c.res({
//         image: (
//             <div></div>
//         ),
//         intents: [
//             <Button value='asd'>asd</Button>
//         ]
//     })
// })

devtools(app, {serveStatic})

export const GET = handle(app)
export const POST = handle(app)
