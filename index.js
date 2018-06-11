// require('env2')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const csv=require('csvtojson')

const csvFilePath=path.join(__dirname, 'developers.csv')

const getJSON = () => csv()
  .fromFile(csvFilePath)
  .then(data =>
    data.map(({
      ['First Name']: firstName,
      ['Last name']: lastName,
      ['Github handle']: ghHandle
    }) => ({
      firstName,
      lastName,
      ghHandle
    }))
  )
  .then(data =>
    data.filter(entry => !(entry.firstName === '' && entry.lastName === ''))
  )
  .then(data =>
    data.map(({ firstName, lastName, ghHandle }) => ({
      name: `${firstName} ${lastName}`,
      ghHandle
    }))
  )

const cvUrl = ghHandle =>
  `https://raw.githubusercontent.com/${ghHandle}/hire-me/master/cv.pdf`


const downloadCv = ghHandle => axios({
  method:'get',
  url: cvUrl(ghHandle),
  responseType: 'stream'
})

const cvFilePath = name => path.join(__dirname, 'cvs', `${name}.pdf`)

const saveCv = (name, cvStream) => new Promise((resolve, reject) => {
  const writeStream = fs.createWriteStream(cvFilePath(name))

  cvStream.pipe(writeStream)
})

const downloadAndSave = (({ name, ghHandle }) => {
  return downloadCv(ghHandle)
    .then(response => {
      return saveCv(name, response.data)
    }, e => {
      const { response } = e
      console.log(`request for ${ghHandle} failed. Status code ${response.status}`);
    })
})

const run = async function() {
  const ghHandle = 'des-des'


  try {
    const people = await getJSON()
    await Promise.all(
      people.map(person =>
        downloadAndSave(person)
          .catch(e => { console.error(e) })
      )
    )
  } catch (e) {
    console.log('!!!!!!!!!');
    console.error(e)

    return;
  }

  console.log(`Successfully saved cvs`);
}

run()
