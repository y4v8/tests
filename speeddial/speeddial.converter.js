//
// The converter from currently unsupported the 'Speed Dial' extension (http://speeddial.uworks.net/download.html)
// to the 'Group Speed Dial' extension (https://addons.mozilla.org/ru/firefox/addon/groupspeeddial/)
// 

const fs = require('fs')

const updateItems = items => (id, name, value) => {
  if (items[id-1] == undefined) {
    items[id-1] = {}
  }
  items[id-1][name] = value
}

const lineHandler = updater => line => {
  const keyValue = line.split('=')
  if (keyValue.length < 2) {
    return
  }
  const [type, id, name] = keyValue[0].split('-')
  if (name == undefined) {
    return
  }
  const update = updater(type)
  if (update == undefined) {
    return
  }
  const value = keyValue.slice(1).join('=')
  update(id, name, value)
}

const readData = text => {
  const data = {
    groups: [],
    dials: []
  }

  const updateGroups = updateItems(data.groups)
  const updateDials = updateItems(data.dials)
  
  const updateByType = type => {
    if (type == 'thumbnail') {
      return updateDials
    } else if (type == 'group') {
      return updateGroups
    }
  }

  const lines = text.split('\n')
  lines.forEach(lineHandler(updateByType))
  
  return data
}

const convertData = data => {
  const result = {
    groups: []
  }

  let total = 0
  data.groups.forEach((group, i) => {
    const dials = []
    const count = group.rows * group.columns
    for (let n=0; n<count; n++) {
      const dial = data.dials[total + n] == undefined ? {} : {
        "name": decodeURI(data.dials[total + n].label),
        "type": 0,
        "url": data.dials[total + n].url,
        "note": 0,
        "created": 0,
        "thumbnail": {
          "type": 0,
          "value": 0,
          "position": 1,
          "background": ""
        }
      }
      dials.push(dial)
    }
    total += count
    
    result.groups.push({
      "id": i,
      "name": group.title,
      "rows": group.rows,
      "cols": group.columns,
      "ratio": 0,
      "background": 0,
      "color": 0,
      "dials": dials
    })
  })

  return JSON.stringify(result)
}

function main() {
  if (process.argv.length != 3) {
    console.error('Example:\nnode speeddial.converter.js [filename.speeddial]')
    return
  }
  const filename = process.argv[2]

  if (!fs.existsSync(filename)) {
    console.error(`File '${filename}' is not found`)
    return
  }
  let text = fs.readFileSync(filename, 'utf8')

  const data = readData(text)
  text = convertData(data)
  console.log(text)
}

main()
