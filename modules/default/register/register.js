Module.register("register", {
  defaults: {
    title: "자서전 인터뷰 장비 등록하기",
    description: "인터뷰 장비의 serial ID를 입력해 주세요."
  },

  /** post api 와 page 이동 함수 **/
  postData(data) {
    this.sendNotification("PAGE_CHANGED", 1);  // 200일 때 페이지 이동
  },

  /** dom, style - bottom sheet control을 위해 dom 사용 **/
  getDom() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("wrapper");

    // 타이틀, 설명
    const title = document.createElement("h1");
    title.textContent = this.config.title;
    wrapper.appendChild(title);

    const desc = document.createElement("p");
    desc.textContent = this.config.description;
    wrapper.appendChild(desc);

    // 입력 필드
    const serial_input = document.createElement("input");
    serial_input.placeholder = "Serial ID";
    wrapper.appendChild(serial_input);

    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("flex-row");
    buttonContainer.addEventListener("click", () => this.showBottomSheet())

    const information_text = document.createElement("p");
    information_text.textContent = "Serial ID를 어디서 확인하나요 ?";

    // 등록하기 버튼 (아이콘 이미지)
    const information_icon = document.createElement("img");
    information_icon.src = "modules/default/register/assets/info_icon.svg"; // 외부 SVG 경로
    information_icon.alt = "info icon";
    information_icon.classList.add("info_icon");

    // 버튼 컨테이너에 요소 추가
    buttonContainer.appendChild(information_text);
    buttonContainer.appendChild(information_icon);

    // 버튼 컨테이너를 wrapper에 추가
    wrapper.appendChild(buttonContainer);

    // 등록하기 버튼
    const submit_btn = document.createElement("button");
    submit_btn.textContent = "등록하기";
    submit_btn.addEventListener("click", () => {
      const serialId = serial_input.value;  // input 필드 값 가져오기
      if (serialId) {
        const data = { serialId };  // 보낼 데이터 구성
        this.postData(data);        // POST 호출
        this.sendNotification("REGISTER_SUBMIT", data); // 알림 전송 (원하면)
        this.showBottomSheet();     // 바텀시트 보여주기 (원하면)
      } else {
        alert("Serial ID를 입력해주세요!");
      }
    });
    wrapper.appendChild(submit_btn);

    // Bottom Sheet 생성 (처음에는 hidden)
    const sheet = document.createElement("div");
    sheet.className = "bottom-sheet hidden";
    sheet.innerHTML = `
        <h1 id="sheet-title">Serial ID 확인하기</h1>
        <div class="sheet-info-box">
          <p id="sheet-step">1/2</p>
          <p id="sheet-content">아래와 같이 기기의 블루투스를 연결해주세요.</p>
        </div>
        <video id="sheet-video" src="modules/default/register/video/example_video1.mp4" width="100%" autoplay loop muted></video>
        <button id="sheet-button">다음</button>
    `;
    wrapper.appendChild(sheet);
    this.sheetElement = sheet;

    // Overlay 생성 (처음에는 hidden)
    const overlay = document.createElement("div");
    overlay.className = "bottom-sheet-overlay hidden";
    wrapper.appendChild(overlay);

    // overlay 클릭 시 닫기
    overlay.addEventListener("click", () => {
      this.hideBottomSheet();
    });

    return wrapper;
  },

  getStyles() {
    return ["register.css"];
  },

  /** bottom sheet 영역 **/
  showBottomSheet() {
    const sheet = document.querySelector(".bottom-sheet");
    const overlay = document.querySelector(".bottom-sheet-overlay");
    if (sheet && overlay) {
      sheet.classList.remove("hidden");
      sheet.classList.add("show");
      overlay.classList.remove("hidden");
      overlay.classList.add("show");

      const video = sheet.querySelector("#sheet-video");
      const step_t = sheet.querySelector("#sheet-step");
      const content = sheet.querySelector("#sheet-content");
      const nextBtn = sheet.querySelector("#sheet-button");
      
      const handleClick = () => {
        if (nextBtn.textContent === "닫기") {
          this.hideBottomSheet();
          nextBtn.removeEventListener("click", handleClick);  // 이벤트 중복 방지

          // 초기화
          step_t.textContent = "1/2";
          content.textContent = "아래와 같이 기기의 블루투스를 연결해주세요.";
          video.src = "modules/default/register/video/example_video1.mp4";
          video.load();  // 비디오 소스 변경 후 로드
          video.play();
          nextBtn.textContent = "다음";
        } else {
          step_t.textContent = "2/2";
          content.textContent = "아래와 같이 화면애 뜬 Serail ID를 확인해주세요.";
          video.src = "modules/default/register/video/example_video2.mp4";
          video.load();  // 비디오 소스 변경 후 로드
          video.play();
          nextBtn.textContent = "닫기";
        }
      };

      nextBtn.addEventListener("click", handleClick);
    }
  },

  hideBottomSheet() {
    const sheet = document.querySelector(".bottom-sheet");
    const overlay = document.querySelector(".bottom-sheet-overlay");
    if (sheet && overlay) {
      sheet.classList.remove("show");
      sheet.classList.add("hidden");
      overlay.classList.remove("show");
      overlay.classList.add("hidden");
    }
  },
});