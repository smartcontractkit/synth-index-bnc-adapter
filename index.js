const rp = require('request-promise')
const snx = require('synthetix')

const getPriceData = async (synth) => {
  return rp({
    url: 'https://api.bravenewcoin.com/chainlink/mwa-historic',
    headers: {
      'X-Chainlink-API-Key': process.env.API_KEY
    },
    qs: {
      market: 'USD',
      coin: synth.symbol
    },
    json: true
  })
}

const calculateIndex = (data) => {
  return 1
}

const createRequest = async (input, callback) => {
  const datas = snx.getSynths({ network: 'mainnet' }).filter(({ index, inverted }) => index && !inverted)
  const data = datas.find(d => d.name === 'sCEX')
  await Promise.all(data.index.map(async (synth) => {
    synth.priceData = await getPriceData(synth)
  }))

  data.result = calculateIndex(data)

  callback(200, {
    jobRunID: input.id,
    data: data,
    result: data.result,
    statusCode: 200
  })
}

exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data)
  })
}

exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data)
  })
}

exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false
    })
  })
}

module.exports.createRequest = createRequest
