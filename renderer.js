const openButtonElement = document.getElementById('open_folder')
const chapterListElement = document.getElementById('chapter_list_ul')
const chatListElement = document.getElementById('chat_list_ul')
const titleElement = document.getElementById('course_name')
const currentTimeElement = document.getElementById('cur_time')
const totalTimeElement = document.getElementById('total_time')
const pptPlayerElement = document.getElementById('ppt_player')
const pptImgElement = document.getElementById('ppt_img')
const videoElement = document.getElementById('camera_video')
const videoDesktopElement = document.getElementById('camera_desktop')
const playPauseElement = document.getElementById('play_pause')
const backwardElement = document.getElementById('backward')
const forwardElement = document.getElementById('forward')
const currentTimeTipElement = document.getElementById('current_time_tip')
const currentTimeTextElement = document.getElementById('current_time_text')
const progressBarElement = document.getElementById('progress_bar')
const progressBarNowElement = document.getElementById('progress_bar_now')
const videoSpeedElement = document.getElementById('video_speed')
const videoSpeedShowElement = document.getElementById('video_speed_show')
const videoSpeedTypeElement = document.getElementById('video_speed_type')
const soundButtonElement = document.getElementById('sound_button')
const soundSlideElement = document.getElementById('sound_slide')
const soundSlideNowElement = document.getElementById('sound_slide_now')
const canvas = document.getElementById('draw_canvas')
const ctx2d = canvas.getContext('2d')

var courseSeconds = 0
var currentSeconds = 0.0
var medias = null
var intervalID = null
var path = null
var chapterList = null
var chatList = null
var drawList = [{ "st": 0.0, "c": "" }]
var videoSpeedTime = 1.0//倍速时间
var lastDrawIndex = -1//上次绘制的draw的index

function clock() {
  //每1秒增加的时间为当前时间加上倍速时间
  currentSeconds = currentSeconds + videoSpeedTime
  currentTimeElement.innerHTML = formatSeconds(currentSeconds)
  if (currentSeconds >= courseSeconds) {
    currentTimeElement.innerHTML = formatSeconds(courseSeconds)
    clearInterval(intervalID)
    intervalID = null
    playPauseElement.setAttribute("class", "fa fa-play")
  }
  //更新进度条
  total_width = progressBarElement.getBoundingClientRect().width
  progressBarNowElement.setAttribute("style", "width:" + parseInt(currentSeconds / courseSeconds * total_width) + "px")
  //是否需要切换视频
  updateVideo()
  //是否需要切换章节列表、ppt和聊天列表
  updateChapterListPPTAndChatList()
  updateCanvas(false)
}

function updateVideo() {
  //是否需要切换视频
  var haveVideo = false
  for (let i = 0; i < medias.length; i++) {
    if (currentSeconds >= medias[i]['start'] && currentSeconds < medias[i]['end']) {
      haveVideo = true
      video_src = 'file://' + path + '\\' + medias[i]['url']
      if (medias[i]['url'].indexOf('video') != -1) {
        videoDesktopElement.setAttribute("src", '')
        if (videoElement.getAttribute("src") != video_src) {
          videoElement.setAttribute("src", video_src)
          videoElement.load()
        }
        if (Math.abs(medias[i]['start'] + videoElement.currentTime - currentSeconds) > 1) {
          videoElement.currentTime = currentSeconds - medias[i]['start']
        }
        if (intervalID != null) {
          videoElement.play()
        }
      } else if (medias[i]['url'].indexOf('desktop') != -1) {
        videoElement.setAttribute("src", '')
        if (videoDesktopElement.getAttribute("src") != video_src) {
          videoDesktopElement.setAttribute("src", video_src)
          videoDesktopElement.load()
        }
        if (Math.abs(medias[i]['start'] + videoDesktopElement.currentTime - currentSeconds) > 1) {
          videoDesktopElement.currentTime = currentSeconds - medias[i]['start']
        }
        if (intervalID != null) {
          videoDesktopElement.play()
        }
      }
      break
    }
  }
  if (!haveVideo) {
    videoElement.setAttribute('src', '')
    videoDesktopElement.setAttribute('src', '')
  }
  //如果视频倍速未应用，则应用
  if (videoElement.playbackRate != videoSpeedTime) {
    videoElement.playbackRate = videoSpeedTime
  }
  if (videoDesktopElement.playbackRate != videoSpeedTime) {
    videoDesktopElement.playbackRate = videoSpeedTime
  }
}

function updateChapterListPPTAndChatList() {
  if (chapterList == null) return
  for (let i = 0; i < chapterList.length; i++) {
    if (currentSeconds >= chapterList[i]["page"]["st"] &&
      (i + 1 == chapterList.length || currentSeconds < chapterList[i + 1]["page"]["st"])) {
      //和聊天列表的scrollIntoView无法同时滚动，因此选择将这个scrollIntoView平滑动画取消
      chapterListElement.children[i].scrollIntoView({ block: 'center' })
      if (chapterListElement.children[i].getAttribute("class") != "clicked") {
        clearChapterListClicked()
        chapterListElement.children[i].setAttribute("class", "clicked")
      }
      if (pptImgElement.getAttribute("src") != chapterListElement.children[i].getAttribute("img")) {
        pptImgElement.setAttribute("src", chapterListElement.children[i].getAttribute("img"))
      }
      break
    }
  }
  //是否需要滚动聊天
  for (let i = 0; i < chatList.length - 1; i++) {
    if (currentSeconds >= parseInt(chatList[i]['time']) && currentSeconds < parseInt(chatList[i + 1]['time'])) {
      chatListElement.children[i].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
}

function updateCanvas(forceRepaint) {
  //是否需要canvas绘图
  var csDrawIndex = -1
  for (let i = 0; i < drawList.length; i++) {
    if (currentSeconds >= drawList[i]["st"] &&
      (i == drawList.length - 1 || currentSeconds < drawList[i + 1]["st"])) {
      csDrawIndex = i
      break
    }
  }
  if (!forceRepaint) {
    if (lastDrawIndex < csDrawIndex) {
      let startDrawIndex = lastDrawIndex + 1 < drawList.length ? lastDrawIndex + 1 : lastDrawIndex
      for (let i = csDrawIndex; i >= lastDrawIndex; i--) {
        if (i == -1) break
        if (drawList[i]["c"] == "") {
          startDrawIndex = i
          break
        }
      }
      for (let i = startDrawIndex; i <= csDrawIndex; i++) {
        if (i == -1) continue
        drawCanvas(drawList[i]["c"])
        lastDrawIndex = i
      }
    } else if (csDrawIndex < lastDrawIndex) {
      let startDrawIndex = 0
      for (let i = csDrawIndex; i >= 0; i--) {
        if (drawList[i]["c"] == "") {
          startDrawIndex = i
          break
        }
      }
      for (let i = startDrawIndex; i <= csDrawIndex; i++) {
        drawCanvas(drawList[i]["c"])
        lastDrawIndex = i
      }
    }
  } else {
    let startDrawIndex = 0
    for (let i = csDrawIndex; i >= 0; i--) {
      if (drawList[i]["c"] == "") {
        startDrawIndex = i
        break
      }
    }
    for (let i = startDrawIndex; i <= csDrawIndex; i++) {
      drawCanvas(drawList[i]["c"])
      lastDrawIndex = i
    }

  }

}

function drawCanvas(drawContent) {
  //空字符串是清空画板
  if (drawContent == "") {
    ctx2d.beginPath()
    ctx2d.clearRect(0, 0, canvas.width, canvas.height)
    console.log("clear")
    return
  } else {
    console.log(drawContent)
  }
  paramsList = drawContent.split("|")
  head = paramsList[0]
  var WRatio = canvas.width / 1280
  var HRatio = canvas.height / 960
  //划线draw
  if (head.split("_").pop().startsWith("d")) {
    penRoad = paramsList[4].split(",")
    // ctx2d.beginPath()
    for (let i = 0; i < penRoad.length; i++) {
      if (penRoad[i] == "M") {
        ctx2d.moveTo(Number(penRoad[i + 1]) * WRatio, Number(penRoad[i + 2]) * HRatio)
        i += 2
      } else if (penRoad[i] == "C") {
        ctx2d.quadraticCurveTo(Number(penRoad[i + 1]) * WRatio, Number(penRoad[i + 2]) * HRatio,
          Number(penRoad[i + 3]) * WRatio, Number(penRoad[i + 4]) * HRatio)
        i += 4
      } else if (penRoad[i] == "L") {
        ctx2d.lineTo(Number(penRoad[i + 1]) * WRatio, Number(penRoad[i + 2]) * HRatio)
        i += 2
      } else {
        console.log("error to parse canvas content ", penRoad[i])
      }
    }
    ctx2d.lineWidth = paramsList[2] * WRatio
    ctx2d.strokeStyle = "red"
    ctx2d.lineJoin = 'round'
    ctx2d.lineCap = 'round'
    ctx2d.stroke()
  }
  //画文字txt
  else if (head.split("_").pop().startsWith("t")) {
    ctx2d.clearRect(0, 0, canvas.width, canvas.height)
    var txt = unescape(paramsList[1])
    if (txt == "") return
    positions = paramsList[6].split(",")
    var fontSize = Number(paramsList[3]) * WRatio
    ctx2d.font = fontSize + "px Heiti"
    ctx2d.fillStyle = "red"
    strs = txt.split("\n")
    startX = positions[4]
    startY = positions[5]
    txtH = fontSize * 1.2
    for (let i = 0; i < strs.length; i++) {
      ctx2d.fillText(strs[i], startX * WRatio, startY * HRatio + fontSize * i)
    }
  }
  //画rectangle
  else if (head.split("_").pop().startsWith("r")) {
    ctx2d.lineWidth = paramsList[6] * WRatio
    ctx2d.strokeStyle = "red"
    x1 = Number(paramsList[2])
    y1 = Number(paramsList[3])
    x2 = Number(paramsList[4])
    y2 = Number(paramsList[5])
    ctx2d.strokeRect(x1 * WRatio, y1 * HRatio,
      (x2 - x1) * WRatio, (y2 - y1) * HRatio)
  }
  //画Line
  else if (head.split("_").pop().startsWith("l")) {
    ctx2d.lineWidth = paramsList[6] * WRatio
    ctx2d.strokeStyle = "red"
    x1 = Number(paramsList[2])
    y1 = Number(paramsList[3])
    x2 = Number(paramsList[4])
    y2 = Number(paramsList[5])
    ctx2d.moveTo(x1 * WRatio, y1 * HRatio)
    ctx2d.lineTo(x2 * WRatio, y2 * HRatio)
    ctx2d.stroke()
  }
  //画circle
  else if (head.split("_").pop().startsWith("c")) {
    ctx2d.lineWidth = paramsList[6] * WRatio
    ctx2d.strokeStyle = "red"
    x1 = Number(paramsList[2])
    y1 = Number(paramsList[3])
    x2 = Number(paramsList[4])
    y2 = Number(paramsList[5])
    ctx2d.arc((x1 + x2) / 2 * WRatio, (y1 + y2) / 2 * HRatio,
      (x2 - x1) / 2 * WRatio, 0, Math.PI * 2)
    ctx2d.stroke()
  }
  //画image
  else if (head.split("_").pop().startsWith("i")) {
    url = paramsList[1]
    x = Number(paramsList[4].split(",")[4])
    y = Number(paramsList[4].split(",")[5])
    fileName = url.split("/").pop()
    var img = new Image()
    img.src = 'local-resource://' + path + '\\' + fileName
    img.onload = () => {
      ctx2d.drawImage(img, x * WRatio, y * HRatio, img.width * WRatio, img.height * HRatio)
    }
  }
  //画triangle
  else if (head.split("_").pop().startsWith("a")) {
    ctx2d.lineWidth = paramsList[6] * WRatio
    ctx2d.strokeStyle = "red"
    xmiddle = Number(paramsList[2])
    ymiddle = Number(paramsList[3])
    x1 = Number(paramsList[4])
    y1 = Number(paramsList[5])
    x2 = 2 * xmiddle - x1
    y2 = y1
    x3 = xmiddle
    y3 = y1 - 2 * (y1 - ymiddle)
    ctx2d.moveTo(x1 * WRatio, y1 * HRatio)
    ctx2d.lineTo(x2 * WRatio, y2 * HRatio)
    ctx2d.lineTo(x3 * WRatio, y3 * HRatio)
    ctx2d.lineTo(x1 * WRatio, y1 * HRatio)
    ctx2d.stroke()
  } else {
    console.log("unsupport canvas content format ", drawContent)
  }
}

function imgHoverShow(event) {
  hoverImgElement = event.target.querySelector('.hover_img')
  hoverImgElement.setAttribute('style', 'top:' + (event.target.getBoundingClientRect().top) + 'px')
  hoverImgElement.style.display = 'block'
}
function imgHoverHide(event) {
  event.target.querySelector('.hover_img').style.display = 'none'
}
function chapterListClick(event) {
  var liNode = event.target
  while (liNode.tagName != 'LI') liNode = liNode.parentNode
  currentSeconds = Number(liNode.getAttribute('data_time'))
  progressBarWidth = currentSeconds / courseSeconds * progressBarElement.offsetWidth
  progressBarNowElement.setAttribute('style', 'width: ' + progressBarWidth + 'px')
  currentTimeElement.innerHTML = formatSeconds(currentSeconds)
  // console.log(event.target)
  // console.log(currentSeconds)
  updateVideo()
  updateChapterListPPTAndChatList()
  updateCanvas(false)
}
//根据图片大小变化设置canvas绘图区域大小
pptImgElement.addEventListener("load", resizeCanvas)
window.onresize = resizeCanvas
function resizeCanvas() {
  //计算得到图片的实际宽高
  var imgRealWidth = pptImgElement.width
  var imgRealHeight = pptImgElement.height
  var originWHRatio = pptImgElement.naturalWidth / pptImgElement.naturalHeight
  if (originWHRatio < pptImgElement.width / pptImgElement.height) {
    imgRealWidth = pptImgElement.height * originWHRatio
  } else {
    imgRealHeight = pptImgElement.width / originWHRatio
  }
  // console.log("img real width height: ", imgRealWidth, imgRealHeight)
  //计算得到固定比例刚好把图片框住的canvas的宽高
  var imgRealWHRatio = imgRealWidth / imgRealHeight
  var canvasWHRatio = 1280 / 960
  var canvasWidth = imgRealWidth
  var canvasHeight = imgRealHeight
  if (imgRealWHRatio < canvasWHRatio) {
    canvasWidth = imgRealHeight * canvasWHRatio
  } else {
    canvasHeight = imgRealWidth / canvasWHRatio
  }
  if (Math.abs(canvas.width - canvasWidth) > 5 || Math.abs(canvas.height - canvasHeight) > 5) {
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    updateChapterListPPTAndChatList()
    updateCanvas(true)
  }
}

progressBarElement.addEventListener('mouseenter', (event) => {
  currentTimeTipElement.style.display = 'block'
})
progressBarElement.addEventListener('mousemove', (event) => {
  currentTimeTipElement.style.left = (event.layerX - currentTimeTipElement.offsetWidth / 2) + 'px'
  curSec = event.layerX / progressBarElement.offsetWidth * courseSeconds
  curSec = curSec < 0 ? 0 : curSec
  curSec = curSec > courseSeconds ? courseSeconds : curSec
  currentTimeTextElement.innerHTML = formatSeconds(curSec)
})
progressBarElement.addEventListener('mouseleave', (event) => {
  currentTimeTipElement.style.display = 'none'
})
progressBarElement.addEventListener('mousedown', (event) => {
  document.mouseDownElement = 'progressBar'
  let startPageX = event.pageX
  //获得元素相对于页面的x坐标
  elementX = progressBarElement.getBoundingClientRect().left + document.documentElement.scrollLeft
  let widthX = event.pageX - elementX
  widthX = widthX > progressBarElement.offsetWidth ? progressBarElement.offsetWidth : widthX
  widthX = widthX < 0 ? 0 : widthX
  progressBarNowElement.setAttribute('style', 'width: ' + widthX + 'px')

  //注册鼠标移动事件
  document.onmousemove = (event) => {
    moveX = event.pageX - startPageX
    currentWidth = widthX + moveX
    currentWidth = currentWidth > progressBarElement.offsetWidth ? progressBarElement.offsetWidth : currentWidth
    currentWidth = currentWidth < 0 ? 0 : currentWidth
    progressBarNowElement.setAttribute('style', 'width: ' + currentWidth + 'px')
  }
})

openButtonElement.addEventListener('click', async () => {
  jsonData = await window.electronAPI.openDir()
  console.log(jsonData)
  path = jsonData['dirPath']
  commandsV3 = jsonData['commandsV3']
  playback = jsonData['playback']
  chapterList = jsonData['pageList']
  chapterListElement.innerHTML = ''
  for (let i = 0; i < chapterList.length; i++) {
    var li = document.createElement("li")
    if (chapterList[i]["page"]["c"].startsWith("http")) {
      url = chapterList[i]["page"]["c"].split('/')
      pageName = chapterList[i]["page"]["p"] + "_1.jpg"
      url.pop()
      prefix = url.pop()
    } else {
      prefix = "img"
      pageName = "error.png"
    }
    chapterList[i]["page"]["img"] = 'local-resource://' + path + '\\img\\' + prefix + "-" + pageName
    chapterList[i]["page"]["time"] = formatSeconds(chapterList[i]["page"]["st"])
    li.innerHTML = `
    <span class="circle">${chapterList[i]["page"]["p"]}</span>
    <span class="title">${chapterList[i]["page"]["name"]}</span>
    <span class="chapter_time">${chapterList[i]["page"]["time"]}</span>
    <div class="hover_img">
      <img src="${chapterList[i]["page"]["img"]}"/>
    </div>`
    li.setAttribute("data_time", chapterList[i]["page"]["st"])
    li.setAttribute("img", chapterList[i]["page"]["img"])
    chapterListElement.appendChild(li)
    li.addEventListener("mouseenter", imgHoverShow)
    li.addEventListener("mouseleave", imgHoverHide)
    li.addEventListener('click', chapterListClick)
  }

  for (let i = 0; i < chapterList.length; i++) {
    if ("draw" in chapterList[i]) {
      drawList = drawList.concat(chapterList[i]["draw"])
    }
    if (i != chapterList.length - 1 && chapterList[i]["page"]["c"] != chapterList[i + 1]["page"]["c"]) {
      if (drawList.length > 0 && (drawList[drawList.length - 1]["c"] != ""
        || drawList[drawList.length - 1]["st"] != chapterList[i + 1]["page"]["st"]))
        drawList.push({ "st": chapterList[i + 1]["page"]["st"], "c": "" })
    }
  }
  console.log("drawList: ", drawList)

  chatList = jsonData['msgList']
  chatListElement.innerHTML = ''
  for (let i = 0; i < chatList.length; i++) {
    var li = document.createElement("li")
    li.innerHTML = `
    <div class="c_head">
      <span class="user_name">${chatList[i]['nickname']}</span>
      <span class="chat_time">${formatSeconds(chatList[i]['time'])}</span>
    </div>
    <p>${faceCodeToEmoji(chatList[i]['msg'])}</p>`
    li.setAttribute("data_time", chatList[i]["time"])
    chatListElement.appendChild(li)
  }

  titleElement.innerHTML = playback['data']['title']
  totalTimeElement.innerHTML = formatSeconds(playback['data']['duration'])

  pptImgElement.setAttribute("src", chapterListElement.firstChild.getAttribute("img"))

  courseSeconds = playback['data']['duration']
  medias = playback['data']['medias']
  for (let i = 0; i < medias.length; i++) {
    url = medias[i]['url'][0].split('?')[0].split('/').pop()
    medias[i]['url'] = url
  }
  if (0 >= medias[0]['start'] && 0 <= medias[0]['end']) {
    video_src = 'file://' + path + '\\' + medias[0]['url']
    if (medias[0]['url'].indexOf('video') != -1) {
      if (videoElement.getAttribute("src") != video_src) {
        videoElement.setAttribute("src", video_src)
        videoDesktopElement.setAttribute('src', '')
      }
    } else if (medias[0]['url'].indexOf('desktop') != -1) {
      if (videoDesktopElement.getAttribute("src") != video_src) {
        videoDesktopElement.setAttribute("src", video_src)
        videoElement.setAttribute('src', '')
      }
    }
  }
  progressBarNowElement.setAttribute("style", "width:0px")
})

playPauseElement.addEventListener('click', () => {
  if (courseSeconds == 0) return
  if (intervalID) {
    videoElement.pause()
    videoDesktopElement.pause()
    clearInterval(intervalID)
    intervalID = null
    playPauseElement.setAttribute("class", "fa fa-play")
  } else {
    clock()
    intervalID = setInterval(clock, 1000)
    playPauseElement.setAttribute("class", "fa fa-pause")
  }
})
backwardElement.addEventListener('click', () => {
  currentSeconds -= 15
  currentSeconds = currentSeconds < 0 ? 0 : currentSeconds
  progressBarWidth = currentSeconds / courseSeconds * progressBarElement.offsetWidth
  progressBarNowElement.setAttribute('style', 'width: ' + progressBarWidth + 'px')
  currentTimeElement.innerHTML = formatSeconds(currentSeconds)
  updateVideo()
  updateChapterListPPTAndChatList()
  updateCanvas(false)
})
forwardElement.addEventListener('click', () => {
  currentSeconds += 15
  currentSeconds = currentSeconds > courseSeconds ? courseSeconds : currentSeconds
  progressBarWidth = currentSeconds / courseSeconds * progressBarElement.offsetWidth
  progressBarNowElement.setAttribute('style', 'width: ' + progressBarWidth + 'px')
  currentTimeElement.innerHTML = formatSeconds(currentSeconds)
  updateVideo()
  updateChapterListPPTAndChatList()
  updateCanvas(false)
})
document.addEventListener('keydown', function (event) {
  switch (event.key) {
    case ' ':
      playPauseElement.click()
      break;
    case 'ArrowLeft':
      backwardElement.click()
      break;
    case 'ArrowRight':
      forwardElement.click()
      break;
  }
})

videoSpeedElement.addEventListener('click', () => {
  if (videoSpeedTypeElement.getAttribute('style') == "display: none;") {
    videoSpeedTypeElement.setAttribute('style', "display: block;")
  } else {
    videoSpeedTypeElement.setAttribute('style', "display: none;")
  }
})
for (let i = 0; i < videoSpeedTypeElement.children.length; i++) {
  videoSpeedTypeElement.children[i].addEventListener('click', (event) => {
    if (event.target.innerHTML == "正常播放") {
      videoSpeedShowElement.innerHTML = "倍速"
    } else {
      videoSpeedShowElement.innerHTML = event.target.innerHTML
    }
    //更新倍速时间全局变量
    switch (videoSpeedShowElement.innerHTML) {
      case '0.75x':
        videoSpeedTime = 0.75
        break
      case '1.2x':
        videoSpeedTime = 1.2
        break
      case '1.5x':
        videoSpeedTime = 1.5
        break
      case '1.8x':
        videoSpeedTime = 1.8
        break
      case '2x':
        videoSpeedTime = 2.0
        break
      default:
        videoSpeedTime = 1.0
        break
    }
    //设置视频播放倍速
    videoElement.playbackRate = videoSpeedTime
    videoDesktopElement.playbackRate = videoSpeedTime
  })
}
soundButtonElement.addEventListener('click', () => {
  if (soundButtonElement.getAttribute('class') == 'fa fa-volume-off') {
    soundButtonElement.setAttribute('class', 'fa fa-volume-down')
    lastWidth = soundButtonElement.getAttribute('data-width')
    soundSlideNowElement.setAttribute('style', 'width: ' + lastWidth + 'px')
    videoElement.volume = Number(lastWidth) / soundSlideElement.clientWidth
    videoDesktopElement.volume = Number(lastWidth) / soundSlideElement.clientWidth
  } else {
    soundButtonElement.setAttribute('class', 'fa fa-volume-off')
    soundSlideNowElement.setAttribute('style', 'width: 0px')
    videoElement.volume = 0
    videoDesktopElement.volume = 0
  }
})
soundSlideElement.addEventListener('mousedown', (event) => {
  document.mouseDownElement = 'soundSlide'
  let startPageX = event.pageX
  //获得元素相对于页面的x坐标
  elementX = soundSlideElement.getBoundingClientRect().left + document.documentElement.scrollLeft
  let widthX = event.pageX - elementX
  widthX = widthX > 75 ? 75 : widthX
  widthX = widthX < 0 ? 0 : widthX
  soundSlideNowElement.setAttribute('style', 'width: ' + widthX + 'px')
  currentVolume = widthX / soundSlideElement.clientWidth
  videoElement.volume = currentVolume
  videoDesktopElement.volume = currentVolume
  if (currentVolume == 0) {
    soundButtonElement.setAttribute('class', 'fa fa-volume-off')
  } else {
    soundButtonElement.setAttribute('class', 'fa fa-volume-down')
    soundButtonElement.setAttribute('data-width', soundSlideNowElement.clientWidth + '')
  }
  //注册鼠标移动事件
  document.onmousemove = (event) => {
    moveX = event.pageX - startPageX
    currentWidth = widthX + moveX
    currentWidth = currentWidth > 75 ? 75 : currentWidth
    currentWidth = currentWidth < 0 ? 0 : currentWidth
    soundSlideNowElement.setAttribute('style', 'width: ' + currentWidth + 'px')
    currentVolume = currentWidth / soundSlideElement.clientWidth
    videoElement.volume = currentVolume
    videoDesktopElement.volume = currentVolume
    if (currentVolume == 0) {
      soundButtonElement.setAttribute('class', 'fa fa-volume-off')
    } else {
      soundButtonElement.setAttribute('class', 'fa fa-volume-down')
      soundButtonElement.setAttribute('data-width', soundSlideNowElement.clientWidth + '')
    }
  }
})
//当鼠标弹起的时候，取消鼠标移动监听
document.onmouseup = (event) => {
  document.onmousemove = null
  if (document.mouseDownElement == 'progressBar') {
    //获得元素相对于页面的x坐标
    elementX = progressBarElement.getBoundingClientRect().left + document.documentElement.scrollLeft
    let widthX = event.pageX - elementX
    widthX = widthX > progressBarElement.offsetWidth ? progressBarElement.offsetWidth : widthX
    widthX = widthX < 0 ? 0 : widthX
    progressBarNowElement.setAttribute('style', 'width: ' + widthX + 'px')
    //设置时间
    curSec = widthX / progressBarElement.offsetWidth * courseSeconds
    currentTimeElement.innerHTML = formatSeconds(curSec)
    currentSeconds = curSec
    updateVideo()
    updateChapterListPPTAndChatList()
    updateCanvas(false)
  }
  document.mouseDownElement = ''
}
//将聊天记录中的[]表情代码转换为Emoji表情
const face2Emoji = {'[aha]':"😲", '[tongue]':"😛", '[why]':"❓️", '[hard]':"😣", 
  '[S_FLOWER]':"🌹", '[dog]':'🐶', '[爱心]':'💖', '[happy]':'😄', '[IMG]':'🧩', 
  '[like]':'🩷', '[titter]':'🤭', '[expect]':'🤩', '[melon]':'🍈', '[love]':'💕',
  '[laugh]':'😄', '[good]':'👍', '[bye]':'👋', '[pitiful]':'🥺', '[slime]':'🤢', 
  '[handssors]':'✌️', '[amaz]':'😲', '[handclap]':'👏', '[flower]':'🌹', '[daze]':'😵‍💫', 
  '[silly]':'🤪', '[six]':'6️⃣', '[heart]':'❤️', '[cool]':'😎'}
function faceCodeToEmoji(content){
  for(var fc in face2Emoji){
    content = content.replaceAll(fc,face2Emoji[fc])
  }
  return content
}

function clearChapterListClicked() {
  for (let i = 0; i < chapterList.length; i++) {
    chapterListElement.children[i].setAttribute("class", "")
  }
}

function formatSeconds(value) {
  let second = parseInt(Math.round(value)); //  秒
  let minute = 0; //  分
  let hour = 0; //  时
  if (second > 59) {
    minute = parseInt(second / 60)
    second = parseInt(second % 60)
    if (minute > 59) {
      hour = parseInt(minute / 60)
      minute = parseInt(minute % 60)
    }
  }
  if (second < 10) second = '0' + second; //秒数补零
  if (minute < 10) minute = '0' + minute; //分钟补零
  if (hour < 10) hour = '0' + hour; //小时补零
  result = hour + ':' + minute + ':' + second
  // console.log(hour, minute, second);
  return result
}

function timeStrToSec(timeStr) {
  const strArray = timeStr.split(":").map(Number)
  if (strArray.length == 2) {
    return strArray[0] * 60 + strArray[1]
  } else if (strArray.length == 3) {
    return strArray[0] * 3600 + strArray[1] * 60 + strArray[2]
  } else {
    return strArray[0]
  }
}