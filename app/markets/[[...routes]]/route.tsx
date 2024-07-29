/** @jsxImportSource frog/jsx */

import {Button, Frog, TextInput} from 'frog'
import { devtools } from 'frog/dev'
import {handle} from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import {Token} from "@/types/tokens";
import {defaultChain} from "@/queries/constants";
import {getQuote} from "@/queries/market";
import {fixedProductMarketMakerABI} from "@/contracts/abi/fixedProductMarketMakerABI";
import {Address, erc20Abi, parseUnits} from "viem";
import {getViemClient} from "@/contracts/utils";
import {readFile} from "fs/promises";

const localFont = await readFile('./cool-green-frog.ttf');

const app = new Frog({
  title: '',
  assetsPath: '/',
  basePath: '/markets',
    imageOptions: {
        fonts: [
            {
                name: 'Helvetica',
                data: localFont,
            },
        ],
    },
})

let accountToInvestmentAmountRaw = '0'
let accountToInvestmentAmountBI: bigint
let addressOfMarket = ''
let market
let collateralToken
let quote
let outcomeIndex
const apiUrl = 'https://api.limitless.exchange'

app.frame('/start/:address', async (c) => {
    const marketAddress = c.req.param('address')
    addressOfMarket = marketAddress

    const marketData = await fetch(`${apiUrl}/markets/${marketAddress}`, {
        method: 'GET'
    })
    const marketResponse = await marketData.json()
    market = marketResponse
    const tokeData = await fetch(`${apiUrl}/tokens`, {
        method: 'GET'
    })
    const tokensResponse: Token[] = await tokeData.json()
    const token = tokensResponse.find((token) => token.address.toLowerCase() === marketResponse.collateralToken[defaultChain.id].toLowerCase()) as Token
    collateralToken = token
    return c.res({
        browserLocation: `https://limitless.exchange/markets/${marketAddress}`,
        action: `/approve`,
        image: (
            <div style={{
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                fontSize: 60,
                backgroundColor: '#0000EE',
                height: '100%',
                padding: '5% 4%',
                justifyContent: 'space-between',
                maxWidth: '100%'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '56px'
                }}>
                    <div style={{
                        display: 'flex',
                        fontFamily: 'Helvetica',
                        color: 'white',
                        fontWeight: 500
                    }}>{marketResponse.title}</div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <img src="/arrow.svg" alt="logo" style={{width: '396px', height: '81px'}}/>
                        <span style={{ fontFamily: 'Helvetica' }}>Yes {marketResponse.prices[0]}%</span>
                    </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <img src="/logo-white.svg" alt="logo" style={{width: '222px', height: '64px'}}/>
                    <div style={{display: 'flex', gap: '40px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <img src='/liquidity-icon.svg' alt='liquidity' style={{width: '32px', height: '32px'}}/>
                            <span style={{
                                color: 'white',
                                fontSize: '32px',
                                fontFamily: 'Helvetica'
                            }}>{marketResponse.liquidityFormatted} {token.symbol}</span>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <img src='/calendar-icon.svg' alt='liquidity' style={{width: '32px', height: '32px'}}/>
                            <span style={{
                                color: 'white',
                                fontSize: '32px',
                                fontFamily: 'Helvetica'
                            }}>{marketResponse.expirationDate}</span>
                        </div>
                    </div>
                </div>
            </div>
        ),
        intents: [
            <TextInput placeholder={`Enter amount ${token.symbol}`}/>,
            <Button value='buyYes'>Yes {marketResponse.prices[0].toFixed(2)}%</Button>,
            <Button value='buyNo'>No {marketResponse.prices[1].toFixed(2)}%</Button>,
            <Button.Link href={`https://limitless.exchange/markets/${marketAddress}`}>Open Limitless</Button.Link>
        ],
        title: marketResponse.title
    });
})

app.frame('/approve', async (c) => {
    const { buttonValue, frameData: { inputText } } = c
    const investmentAmount = parseUnits(inputText || '1', collateralToken.decimals);
    accountToInvestmentAmountRaw = inputText || '1'
    accountToInvestmentAmountBI = investmentAmount;
    const values = await getQuote(addressOfMarket, accountToInvestmentAmountRaw, collateralToken, buttonValue === 'buyYes' ? 0: 1, market.prices)
    quote = values
    outcomeIndex = buttonValue === 'buyYes' ? 0: 1

    return c.res({
        action: `/buy`,
        image: (
            <div style={{
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                fontSize: 60,
                backgroundColor: '#0000EE',
                height: '100%',
                padding: '5% 4%',
                justifyContent: 'space-between',
                maxWidth: '100%'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '56px'
                }}>
                    <div style={{
                        display: 'flex',
                        fontFamily: 'Helvetica',
                        color: 'white',
                        fontWeight: 500
                    }}>Approve transaction?
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '42px'}}>
                        <div style={{display: 'flex', gap: '84px', width: '80%'}}>
                            <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                                <span style={{fontSize: '40px', fontFamily: 'Helvetica'}}>Avg. Price</span>
                                <span style={{fontSize: '40px', fontFamily: 'Helvetica'}}>{values ? (+values.outcomeTokenPrice).toFixed(6) : 0} {collateralToken.symbol}</span>
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                                <span style={{fontSize: '40px', fontFamily: 'Helvetica'}}>Est. ROI</span>
                                <span style={{fontSize: '40px', fontFamily: 'Helvetica'}}>{values ? (+values.roi).toFixed(2) : 0}%</span>
                            </div>
                        </div>
                        <div style={{display: 'flex', gap: '84px', width: '80%'}}>
                            <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                                <span style={{fontSize: '40px', fontFamily: 'Helvetica'}}>Potential Return</span>
                                <span style={{fontSize: '40px', fontFamily: 'Helvetica'}}>{values ? (+values.outcomeTokenAmount).toFixed(6) : 0} {collateralToken.symbol}</span>
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                                <span style={{fontSize: '40px', fontFamily: 'Helvetica'}}>Price Impact</span>
                                <span style={{fontSize: '40px', fontFamily: 'Helvetica'}}>{values ? (+values.priceImpact).toFixed(2) : '0.00'}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                <img src="/logo-white.svg" alt="logo" style={{width: '222px', height: '64px'}}/>
            </div>
        ),
        intents: [
            <Button.Transaction target='/approve-tx'>Approve Transaction</Button.Transaction>,
            <Button.Link href={`https://limitless.exchange/markets/${addressOfMarket}`}>Open Limitless</Button.Link>
        ],
        title: market.title
    })
})

app.transaction('/approve-tx', (c) => {
    return c.contract({
        abi: erc20Abi,
        functionName: 'approve',
        args: [addressOfMarket as Address, accountToInvestmentAmountBI],
        chainId: `eip155:${defaultChain.id}`,
        to: collateralToken.address as Address
    })
})

app.frame('/buy', (c) => {
    return c.res({
        image: (
            <div style={{
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                fontSize: 60,
                backgroundColor: '#0000EE',
                height: '100%',
                padding: '5% 4%',
                justifyContent: 'space-between',
                maxWidth: '100%'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '56px'
                }}>
                    <div style={{
                        display: 'flex',
                        fontFamily: 'Helvetica',
                        color: 'white',
                        fontWeight: 500
                    }}>Sign transaction?
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '42px'}}>
                        <div style={{display: 'flex', gap: '84px', width: '80%'}}>
                            <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                                <span style={{fontSize: '40px', fontFamily: 'Helvetica'}}>Avg. Price</span>
                                <span
                                    style={{fontSize: '40px', fontFamily: 'Helvetica'}}>{(+quote.outcomeTokenPrice).toFixed(6)} {collateralToken.symbol}</span>
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                                <span style={{fontSize: '40px', fontFamily: 'Helvetica'}}>Est. ROI</span>
                                <span style={{fontSize: '40px', fontFamily: 'Helvetica'}}>{(+quote.roi).toFixed(2)}%</span>
                            </div>
                        </div>
                        <div style={{display: 'flex', gap: '84px', width: '80%'}}>
                            <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                                <span style={{fontSize: '40px', fontFamily: 'Helvetica'}}>Potential Return</span>
                                <span
                                    style={{fontSize: '40px', fontFamily: 'Helvetica'}}>{(+quote.outcomeTokenAmount).toFixed(6)} {collateralToken.symbol}</span>
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                                <span style={{fontSize: '40px', fontFamily: 'Helvetica'}}>Price Impact</span>
                                <span
                                    style={{fontSize: '40px', fontFamily: 'Helvetica'}}>{(+quote.priceImpact).toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                <img src="/logo-white.svg" alt="logo" style={{width: '222px', height: '64px'}}/>
            </div>
        ),
        intents: [
            <Button.Transaction target='/buy-tx'>Buy</Button.Transaction>,
            <Button.Link href={`https://limitless.exchange/markets/${addressOfMarket}`}>Open Limitless</Button.Link>
        ],
        title: market.title
    })
})
app.transaction('/buy-tx', async (c) => {
    const client = getViemClient()

    const minOutcomeTokensToBuy = await client.readContract({
        address: addressOfMarket as Address,
        abi: fixedProductMarketMakerABI,
        functionName: "calcBuyAmount",
        args: [accountToInvestmentAmountBI, outcomeIndex],
    });

    return c.contract({
        abi: fixedProductMarketMakerABI,
        functionName: "buy",
        args: [accountToInvestmentAmountBI, outcomeIndex, minOutcomeTokensToBuy],
        chainId: `eip155:${defaultChain.id}`,
        to: addressOfMarket as Address,
    });
})

devtools(app, {
    basePath: '/debug', // devtools available at `http://localhost:5173/debug`
    serveStatic,
})

export const GET = handle(app)
export const POST = handle(app)
