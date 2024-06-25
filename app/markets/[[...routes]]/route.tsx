/** @jsxImportSource frog/jsx */

import {Button, Frog, TextInput} from 'frog'
import { devtools } from 'frog/dev'
import {handle} from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import {Token} from "@/types/tokens";
import {defaultChain} from "@/queries/constants";
import {getQuote} from "@/queries/market";
import {fixedProductMarketMakerABI} from "@/contracts/abi/fixedProductMarketMakerABI";
import {Address, erc20Abi, formatUnits, parseUnits} from "viem";
import {getViemClient} from "@/contracts/utils";

type State = {
    marketAddress: string
    collateralToken: Token | null,
}

const app = new Frog<{State: State}>({
  assetsPath: '/',
  basePath: '/markets',
    initialState: {
      marketAddress: '',
      collateralToken: null
    }
})

app.frame('/:address', async (c) => {
    const { deriveState } = c
    const state = deriveState(previousState => {
        if(!previousState.marketAddress) {
            previousState.marketAddress = c.req.param('address')
        }
    })
    const marketAddress = state.marketAddress || c.req.param('address')
    const marketData = await fetch(`https://dev.api.limitless.exchange/markets/${marketAddress}`, {
        method: 'GET'
    })
    const marketResponse = await marketData.json()
    const tokeData = await fetch('https://dev.api.limitless.exchange/tokens', {
        method: 'GET'
    })
    const tokensResponse: Token[] = await tokeData.json()
    const collateralToken = tokensResponse.find((token) => token.address.toLowerCase() === marketResponse.collateralToken[defaultChain.id].toLowerCase()) as Token
    return c.res({
        action: `/buy/${marketAddress}`,
        image: (
            <div style={{
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                fontSize: 60,
                backgroundImage: `url("https://storage.googleapis.com/limitless-exchange-assets/assets/background.png")`,
                backgroundSize: '100% 100%',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                paddingLeft: '15%',
                paddingRight: '15%',
                maxWidth: '100%'
            }}>
                <img src="/logo.png" alt="logo" style={{width: '185px', height: '40px'}}/>
                <span style={{fontSize: '32px', fontWeight: 'bold', marginTop: '20px'}}>Have skin in your beliefs</span>
                <span style={{
                    fontSize: '40px',
                    fontWeight: 'bold',
                    marginTop: '60px',
                    textAlign: 'center'
                }}>{marketResponse.title}</span>
                <div style={{display: 'flex', gap: '100px', marginTop: '40px'}}>
                    <div
                        style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <span style={{color: '#71FF65', fontSize: '28px'}}>{marketResponse.prices[0].toFixed(2)}%</span>
                        <span style={{color: '#747675', fontSize: '28px'}}>Chance</span>
                    </div>
                    <div
                        style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <span style={{color: '#71FF65', fontSize: '28px'}}>{formatUnits(marketResponse.liquidity, collateralToken.decimals)} {collateralToken.symbol}</span>
                        <span style={{color: '#747675', fontSize: '28px'}}>Volume</span>
                    </div>
                    <div
                        style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <span style={{color: '#71FF65', fontSize: '28px'}}>{marketResponse.expirationDate}</span>
                        <span style={{color: '#747675', fontSize: '28px'}}>Deadline</span>
                    </div>
                </div>
            </div>
        ),
        intents: [
            <TextInput placeholder={`Enter amount ${collateralToken.symbol}`}/>,
            <Button.Transaction
                target={`/approve-tx/${marketAddress}/${collateralToken.decimals}/${collateralToken.address}`}>
                Approve spend
            </Button.Transaction>,
        ],
    });
})

app.transaction("/approve-tx/:address/:decimals/:collateralAddress", (c) => {
    const {inputText} = c;
    if (!inputText) {
        throw new Error("Invalid input: inputText must be a non-empty string");
    }
    const decimals = +c.req.param('decimals')
    const investmentAmount = parseUnits(inputText || '1', decimals);
    const collateralTokenAddress = c.req.param('collateralAddress')
    const marketAddress = c.req.param('address')
    return c.contract({
        abi: erc20Abi,
        functionName: 'approve',
        args: [marketAddress as Address, investmentAmount],
        chainId: "eip155:84532",
        to: collateralTokenAddress as Address
    })
});

app.frame('/buy/:address', async (c) => {
    const { deriveState } = c
    const state = deriveState(previousState => {
        if(!previousState.marketAddress) {
            previousState.marketAddress = c.req.param('address')
        }
    })
    const marketAddress = state.marketAddress || c.req.param('address')

    const { buttonValue, inputText } = c
    const marketData = await fetch(`https://dev.api.limitless.exchange/markets/${marketAddress}`, {
        method: 'GET'
    })
    const marketResponse = await marketData.json()
    const tokeData = await fetch('https://dev.api.limitless.exchange/tokens', {
        method: 'GET'
    })
    const tokensResponse: Token[] = await tokeData.json()

    const collateralToken = tokensResponse.find((token) => token.address.toLowerCase() === marketResponse.collateralToken[defaultChain.id].toLowerCase()) as Token

    const getIntents = () => {
        if(buttonValue !== '_t' && !buttonValue || !inputText) {
            return [
                <TextInput placeholder={`Enter amount ${collateralToken.symbol}`}/>,
                <Button value='buyYes'>Yes {marketResponse.prices[0].toFixed(2)}%</Button>,
                <Button value='buyNo'>No {marketResponse.prices[1].toFixed(2)}%</Button>,
            ]
        }
        return [
            <Button.Transaction target={`/${collateralToken.address}/buy/${collateralToken.decimals}/${buttonValue === 'buyYes' ? '0' : '1'}`}>Buy</Button.Transaction>
        ]
    }

    const getImageDynamicContent = async () => {
        if(inputText && buttonValue) {
            const values = await getQuote(marketResponse, inputText, collateralToken, buttonValue === 'buyYes' ? 0: 1, marketResponse.prices)
            return (
                <>
                    <div style={{display: 'flex', gap: '100px', marginTop: '40px'}}>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span style={{
                                color: '#71FF65',
                                fontSize: '28px'
                            }}>{values ? (+values.outcomeTokenPrice).toFixed(6) : 0} {collateralToken.symbol}</span>
                            <span style={{
                                color: '#747675',
                                fontSize: '28px'
                            }}>Avg. Price</span>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span style={{
                                color: '#71FF65',
                                fontSize: '28px'
                            }}>{values ? (+values.priceImpact).toFixed(2) : '0.00'}%</span>
                            <span style={{color: '#747675', fontSize: '28px'}}>Price Impact</span>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span style={{
                                color: '#71FF65',
                                fontSize: '28px'
                            }}>{values ? (+values.outcomeTokenAmount).toFixed(6) : 0} {collateralToken.symbol}</span>
                            <span style={{
                                color: '#747675',
                                fontSize: '28px'
                            }}>Potential Return</span>
                        </div>
                    </div>
                </>
            )
        }
        return (
            <div style={{display: 'flex', gap: '100px', marginTop: '40px'}}>
                <div
                    style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <span style={{color: '#71FF65', fontSize: '28px'}}>{marketResponse.prices[0].toFixed(2)}%</span>
                    <span style={{color: '#747675', fontSize: '28px'}}>Chance</span>
                </div>
                <div
                    style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <span style={{
                        color: '#71FF65',
                        fontSize: '28px'
                    }}>{formatUnits(marketResponse.liquidity, collateralToken.decimals)} {collateralToken.symbol}</span>
                    <span style={{color: '#747675', fontSize: '28px'}}>Volume</span>
                </div>
                <div
                    style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <span style={{color: '#71FF65', fontSize: '28px'}}>{marketResponse.expirationDate}</span>
                    <span style={{color: '#747675', fontSize: '28px'}}>Deadline</span>
                </div>
            </div>
        )
    }


    return c.res({
        image: (
            <div style={{
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                fontSize: 60,
                backgroundImage: `url("https://storage.googleapis.com/limitless-exchange-assets/assets/background.png")`,
                backgroundSize: '100% 100%',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                paddingLeft: '15%',
                paddingRight: '15%',
                maxWidth: '100%'
            }}>
                <img src="/logo.png" alt="logo" style={{width: '185px', height: '40px'}}/>
                <span style={{fontSize: '32px', fontWeight: 'bold', marginTop: '20px'}}>Have skin in your beliefs</span>
                <span style={{fontSize: '40px', fontWeight: 'bold', marginTop: '60px', textAlign: 'center'}}>{marketResponse.title}</span>
                {await getImageDynamicContent()}
            </div>
        ),
        intents: getIntents(),
    })
})

app.transaction('/:collateralContract/buy/:decimals/:index', async (c) => {
    const {frameData, previousState} = c;
    const client = getViemClient()
    const decimals = +c.req.param('decimals')
    const investmentAmount = parseUnits(frameData?.inputText || '1', decimals);
    const outcomeIndex = +c.req.param('index')

    const minOutcomeTokensToBuy = await client.readContract({
        address: previousState.marketAddress as Address,
        abi: fixedProductMarketMakerABI,
        functionName: "calcBuyAmount",
        args: [investmentAmount, outcomeIndex],
    });

    return c.contract({
        abi: fixedProductMarketMakerABI,
        functionName: "buy",
        args: [investmentAmount, outcomeIndex, minOutcomeTokensToBuy],
        chainId: "eip155:84532",
        to: previousState.marketAddress as Address,
    });
})

devtools(app, {
    basePath: '/debug', // devtools available at `http://localhost:5173/debug`
    serveStatic,
})

export const GET = handle(app)
export const POST = handle(app)
