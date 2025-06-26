(function () {
    var alerts = [
        {
            body: "License for Introduction to Algebra has been assigned to your school",
            tick: "untick.png",
            date: "15-Sep-2018 at 07:21 pm",
            background: "#FFFFEE",
            course: null,
            class: null
        },
        {
            body: "Lesson 3 Practice Worksheet overdue for Amy Santiago",
            tick: "white-tick.png",
            date: "15-Sep-2018 at 05:21 pm",
            background: "#FFFFFF",
            course: "Advanced Mathematics",
            class: null
        },
        {
            body: "23 new students created",
            tick: "untick.png",
            date: "14-Sep-2018 at 01:21 pm",
            background: "#FFFFEE",
            course: null,
            class: null
        },
        {
            body: "15 submissions ready for evaluation",
            tick: "untick.png",
            date: "15-Sep-2018 at 07:21 pm",
            background: "#FFFFEE",
            course: null,
            class: "Basics of Algebra"
        },
        {
            body: "License for Basic Concepts in Geometry has been assigned to your school",
            tick: "untick.png",
            date: "15-Sep-2018 at 07:21 pm",
            background: "#FFFFEE",
            course: null,
            class: null
        },
        {
            body: "Lesson 3 Practice Worksheet overdue for Sam Diego",
            tick: "white-tick.png",
            date: "15-Sep-2018 at 07:21 pm",
            background: "#FFFFFF",
            course: "Advanced Mathematics",
            class: null
        }
    ];
    var alertsContainer = document.querySelector('.alerts_content_container');
    alerts.forEach(function (item) {
        var card = document.createElement('div');
        card.className = 'alerts_contents';
        card.style.backgroundColor = item.background;
        
        card.innerHTML =
            `<div class="alerts_contents_head">
                <div class="alerts_contents_body">${item.body}</div>
                <div class="alerts_contents_head_img">
                    <img src="../quantum-screen-assets/icons/${item.tick}" alt="${item.tick}">
                </div>
            </div>
            ${
                item.course
                    ? `<div class="alerts_contents_course"><span class="alerts_course_1">Course:</span> <span class="alerts_course_2">${item.course}</span></div>`
                    : item.class
                        ? `<div class="alerts_contents_course"><span class="alerts_course_1">Class:</span> <span class="alerts_course_2">${item.class}</span></div>`
                        : ''
            }
            <div class="alerts_contents_bottom" style="${item.attachments ? '' : 'display:flex; justify-content:end;'}">
                <div class="alerts_contents_bottom_1">
                    ${item.attachments ? `<img src="../quantum-screen-assets/icons/attachment.png" alt="attachment">` : ''}
                </div>
                <div class="alerts_contents_bottom_2">
                    ${
                        item.attachments
                            ? `${item.files} file${item.files && item.files > 1 ? 's' : ''} are attached`
                            : ''
                    }
                </div>
                <div class="alerts_contents_bottom_3">${item.date}</div>
            </div>`;
        alertsContainer === null || alertsContainer === void 0 ? void 0 : alertsContainer.appendChild(card);
    });
    var announcements = [
        {
            pa: "Wilson Kumar",
            body: "No classes will be held on 21st Nov",
            tick: "white-tick.png",
            attachments: true,
            files: 2,
            date: "15-Sep-2018 at 07:21 pm",
            background: "#FFFFFF",
            course: null
        },
        {
            pa: "Samson White",
            body: "Guest lecture on Geometry on 20th September",
            tick: "untick.png",
            attachments: true,
            files: 2,
            date: "15-Sep-2018 at 07:21 pm",
            background: "#FFFFEE",
            course: null
        },
        {
            pa: "Wilson Kumar",
            body: "Additional course materials available on request",
            tick: "white-tick.png",
            attachments: false,
            files: 0,
            date: "15-Sep-2018 at 07:21 pm",
            background: "#FFFFFF",
            course: "Mathematics 101"
        },
        {
            pa: "Wilson Kumar",
            body: "No classes will be held on 25th Dec",
            tick: "untick.png",
            attachments: false,
            files: 0,
            date: "15-Sep-2018 at 07:21 pm",
            background: "#FFFFEE",
            course: null
        },
        {
            pa: "Wilson Kumar",
            body: "Additional course materials available on request",
            tick: "untick.png",
            attachments: true,
            files: 2,
            date: "15-Sep-2018 at 07:21 pm",
            background: "#FFFFEE",
            course: "Mathematics 101"
        }
    ];
    var announcement_container = document.querySelector('.announcements_content_container');
    announcements.forEach(function (item) {
        var card = document.createElement('div');
        card.className = 'announcements_contents';
        card.style.backgroundColor = item.background;
        card.innerHTML = `
                <div class="announcements_contents_head">
                    <div class="announcements_contents_head_title">
                        <span class="head_title_1">PA:</span>
                        <span class="head_title_2">${item.pa}</span>
                    </div>
                    <div class="announcements_contents_head_img">
                        <img src="../quantum-screen-assets/icons/${item.tick}" alt="${item.tick}">
                    </div>
                </div>
                <div class="announcements_contents_body">${item.body}</div>
                ${item.course ? `<div class="announcements_contents_course">Course: ${item.course}</div>` : ''}
                <div class="announcements_contents_bottom" style="${item.attachments ? '' : 'display:flex; justify-content:end;'}">
                    <div class="announcements_contents_bottom_1">
                        ${item.attachments ? `<img src="../quantum-screen-assets/icons/attachment.png" alt="attachment">` : ''}
                    </div>
                    <div class="announcements_contents_bottom_2">
                        ${item.attachments ? `${item.files} file${item.files > 1 ? 's' : ''} are attached` : ''}
                    </div>
                    <div class="announcements_contents_bottom_3">${item.date}</div>
                </div>
            `;
        announcement_container === null || announcement_container === void 0 ? void 0 : announcement_container.appendChild(card);
    });
    var data = [
        {
            expired: "",
            image: "../quantum-screen-assets/images/imageMask-1.png",
            title: "Acceleration",
            subject: "Physics",
            grade: "Grade 7",
            additionalGrade: "+2",
            units: 4,
            lessons: 18,
            topics: 24,
            class: "Mr. Frank's Class B",
            students: "50 Students",
            duration: "21-Jan-2020 - 21-Aug-2020",
            starred: true,
            icon1: true,
            icon2: true,
            icon3: true,
            icon4: true
        },
        {
            expired: "",
            image: "../quantum-screen-assets/images/imageMask-2.png",
            title: "Displacement, Velocity and Speed",
            subject: "Physics 2",
            grade: "Grade 6",
            additionalGrade: "+3",
            units: 2,
            lessons: 15,
            topics: 20,
            class: "",
            students: "",
            duration: "",
            starred: true,
            icon1: true,
            icon2: false,
            icon3: false,
            icon4: true
        },
        {
            expired: "",
            image: "../quantum-screen-assets/images/imageMask-3.png",
            title: "Introduction to Biology: Micro organisms and how they affect the other Life Systems in Environment",
            subject: "Biology",
            grade: "Grade 4",
            additionalGrade: "+1",
            units: 5,
            lessons: 16,
            topics: 22,
            class: "All Classes",
            students: "300 Students",
            duration: "",
            starred: true,
            icon1: true,
            icon2: false,
            icon3: false,
            icon4: true
        },
        {
            expired: "EXPIRED",
            image: "../quantum-screen-assets/images/imageMask-4.png",
            title: "Introduction to High School Mathematics",
            subject: "Mathematics",
            grade: "Grade 8",
            additionalGrade: "+3",
            units: "",
            lessons: "",
            topics: "",
            class: "Mr. Frank's Class A",
            students: "44 Students",
            duration: "14-Oct-2019 - 20-Oct-2020",
            starred: false,
            icon1: true,
            icon2: true,
            icon3: true,
            icon4: true
        }
    ];
    var container = document.querySelector('.card_container');
    data.forEach(function (item) {
        var card = document.createElement('div');
        card.className = 'card_1';
        card.innerHTML = `
            <div class="card_content">
                ${item.expired === "" ? "" : `<div class="expired_container">${item.expired}</div>`}
                <div class="main_card_content">
                    <div class="card_image_container">
                        <img src="${item.image}" alt="card_1_image">
                    </div>
                    <div class="card_details">
                        <div class="card_head">
                            <div class="card_title">${item.title}</div>
                            <img src="../quantum-screen-assets/icons/favourite.svg" alt="favourite_icon"
                                style="${item.starred ? '' : 'filter: grayscale(100%);'}">
                        </div>
                        <div class="card_subject_grade" ${item.title === "Acceleration" ? 'style="margin-top:3px"' : 'style="margin-top:7px"'}>
                            <div class="card_subject">${item.subject || ''}</div>
                            <div class="div_line"></div>
                            <div class="card_grade">${item.grade}
                                <div class="card_additional_grade">${item.additionalGrade}</div>
                            </div>
                        </div>
                        <div class="card_course_details">
                            <div class="course_contents">
                                ${item.units ? `<span><span class="numbers">${item.units}</span> units</span>` : ''}
                                ${item.lessons ? `<span><span class="numbers">${item.lessons}</span> lessons</span>` : ''}
                                ${item.topics ? `<span><span class="numbers">${item.topics}</span> Topics</span>` : ''}
                            </div>
                            ${item.class.length === 0
                                ? `<div class="class_selection_box" style='border-bottom: 1px solid rgba(0,0,0,0.12);'>`
                                : `<div class="class_selection_box">`
                            }
                                ${
                                    item.class.length === 0
                                        ? `<select name="course_select" id="course_select" disabled style='color:#222222; opacity:0.4; font-weight: 400;'><option>No Classes</option></select>`
                                        : `<select name="course_select" id="course_select">${item.class ? `<option>${item.class}</option>` : ''}</select>`
                                }
                                <img class="dropdown_arrow" src="../quantum-screen-assets/icons/arrow-down.svg" alt="dropdown_arrow">
                            </div>
                            <div class="course_capacity">
                                ${item.students ? `<div class="course_students">${item.students}</div>` : ''}
                                ${item.duration ? `<div class="div_line"></div> <div class="course_duration">${item.duration}</div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card_icons">
                <div class="icon_extreme"><img src="../quantum-screen-assets/icons/preview.svg" alt="preview_image" style="${item.icon1 ? '' : 'opacity:0.4'}"></div>
                <div class="icon_mid"><img src="../quantum-screen-assets/icons/manage course.svg" alt="manage_course" style="${item.icon2 ? '' : 'opacity:0.4'}"></div>
                <div class="icon_mid"><img src="../quantum-screen-assets/icons/grade submissions.svg" alt="grade_submission" style="${item.icon3 ? '' : 'opacity:0.4'}"></div>
                <div class="icon_extreme"><img src="../quantum-screen-assets/icons/reports.svg" alt="reports_image" style="${item.icon4 ? '' : 'opacity:0.4'}"></div>
            </div>
        `;
        container === null || container === void 0 ? void 0 : container.appendChild(card);
    });



    //------------------------------------- Header Item toggle
    var dashboardItem = document.querySelector('.header_dashboard > a');
    var contentItem = document.querySelector('.header_contents_content > a');
    var userItem = document.querySelector('.header_users > a');
    var reportItem = document.querySelector('.header_reports > a');
    var adminItem = document.querySelector('.header_admin > a');
    var headerItems = [dashboardItem, contentItem, userItem, reportItem, adminItem].filter(Boolean);
    headerItems.forEach(function (link) {
        if (link) {
            link.addEventListener('click', function (event) {
                var _a;
                event.preventDefault();
                document.querySelectorAll('.header_contents > div').forEach(function (div) {
                    div.classList.remove('selected');
                });
                (_a = this.parentElement) === null || _a === void 0 ? void 0 : _a.classList.add('selected');
            });
        }
    });



    //----------------------------- Selection bar toggle
    var selectionBarItems = document.querySelectorAll('.selection_bar > div');
    selectionBarItems.forEach(function (item) {
        item.addEventListener('click', function () {
            var _a;
            (_a = document.querySelector('.selection_bar .selected')) === null || _a === void 0 ? void 0 : _a.classList.remove('selected');
            item.classList.add('selected');
        });
    });



    //------------- Favourite icon toggle
    var starIcons = document.querySelectorAll('img[alt="favourite_icon"]');
    starIcons.forEach(function (star) {
        star.addEventListener('click', function () {
            var isGrayscale = star.style.filter.includes('grayscale');
            if (isGrayscale) {
                star.style.filter = '';
            }
            else {
                star.style.filter = 'grayscale(100%)';
            }
        });
    });



    //--------------------- Hamburger
    var hamburger = document.querySelector('.hamburger');
    var mobileMenu = document.querySelector('.mobile_menu');
    var isHovering = false;
    function showMobileMenu() {
        if (mobileMenu instanceof HTMLElement)
            mobileMenu.style.display = 'flex';
    }
    function hideMenu() {
        if (mobileMenu instanceof HTMLElement)
            mobileMenu.style.display = 'none';
    }
    hamburger === null || hamburger === void 0 ? void 0 : hamburger.addEventListener('mouseenter', function () {
        isHovering = true;
        showMobileMenu();
    });
    hamburger === null || hamburger === void 0 ? void 0 : hamburger.addEventListener('mouseleave', function () {
        isHovering = false;
        hideMenu();
    });
    mobileMenu === null || mobileMenu === void 0 ? void 0 : mobileMenu.addEventListener('mouseenter', function () {
        isHovering = true;
        showMobileMenu();
    });
    mobileMenu === null || mobileMenu === void 0 ? void 0 : mobileMenu.addEventListener('mouseleave', function () {
        isHovering = false;
        hideMenu();
    });


    // Hamburger Menu Child Open and close
    var mainCatalogs = document.querySelectorAll(".main_catalog");
    mainCatalogs.forEach(function (main) {
        main.addEventListener("click", function (e) {
            e.preventDefault();
            var parent = main.parentElement;
            var allMenus = document.querySelectorAll(".mobile_menu > div");
            var isAlreadyActive = main.classList.contains("active");
            allMenus.forEach(function (menu) {
                var mainCat = menu.querySelector(".main_catalog");
                var childCat = menu.querySelector(".child_catalog");
                var arrowImg = mainCat === null || mainCat === void 0 ? void 0 : mainCat.querySelector("img");
                if (mainCat)
                    mainCat.classList.remove("active");
                if (childCat)
                    childCat.classList.remove("active");
                if (arrowImg) {
                    arrowImg.src = "../quantum-screen-assets/icons/keyboard_arrow_down.png";
                }
            });
            var selectedChild = parent.querySelector(".child_catalog");
            var selectedArrow = main.querySelector("img");
            if (!isAlreadyActive) {
                main.classList.add("active");
                if (selectedChild)
                    selectedChild.classList.add("active");
                if (selectedArrow) {
                    selectedArrow.src = "../quantum-screen-assets/icons/keyboard_arrow_up.png";
                }
            }
        });
    });



    //------------------------------------------ Announcements menu
    var header = document.querySelector('.header_announcements');
    var announcements_main_container = document.querySelector('.announcements_main_container');
    var timeout = setTimeout(function () { }, 0);
    header === null || header === void 0 ? void 0 : header.addEventListener('mouseenter', function () {
        clearTimeout(timeout);
        if (announcements_main_container)
            announcements_main_container.style.display = 'block';
    });
    header === null || header === void 0 ? void 0 : header.addEventListener('mouseleave', function () {
        if (announcements_main_container && !announcements_main_container.matches(':hover')) {
            announcements_main_container.style.display = 'none';
        }
    });
    announcements_main_container === null || announcements_main_container === void 0 ? void 0 : announcements_main_container.addEventListener('mouseenter', function () {
        clearTimeout(timeout);
        announcements_main_container.style.display = 'block';
    });
    announcements_main_container === null || announcements_main_container === void 0 ? void 0 : announcements_main_container.addEventListener('mouseleave', function () {
        announcements_main_container.style.display = 'none';
    });



    // --------------------------------Alerts Menu
    var alerts_header = document.querySelector('.header_alerts');
    var alerts_main_container = document.querySelector('.alerts_main_container');
    alerts_header === null || alerts_header === void 0 ? void 0 : alerts_header.addEventListener('mouseenter', function () {
        clearTimeout(timeout);
        if (alerts_main_container instanceof HTMLElement)
            alerts_main_container.style.display = 'block';
    });
    alerts_header === null || alerts_header === void 0 ? void 0 : alerts_header.addEventListener('mouseleave', function () {
        if (alerts_main_container && !alerts_main_container.matches(':hover')) {
            if (alerts_main_container instanceof HTMLElement) {
                alerts_main_container.style.display = 'none';
            }
        }
    });
    alerts_main_container === null || alerts_main_container === void 0 ? void 0 : alerts_main_container.addEventListener('mouseenter', function () {
        if (alerts_main_container instanceof HTMLElement)
            alerts_main_container.style.display = 'block';
    });
    alerts_main_container === null || alerts_main_container === void 0 ? void 0 : alerts_main_container.addEventListener('mouseleave', function () {
        if (alerts_main_container instanceof HTMLElement)
            alerts_main_container.style.display = 'none';
    });



    //---------------------------- Alerts and announcement menu modifications
    var announcementCards = document.querySelectorAll('.announcements_contents');
    announcementCards.forEach(function (card) {
        var tickImg = card.querySelector('.announcements_contents_head_img img');
        if (tickImg) {
            tickImg.addEventListener('click', function () {
                var isWhiteTick = tickImg.src.includes('white-tick.png');
                tickImg.src = "../quantum-screen-assets/icons/".concat(isWhiteTick ? 'untick.png' : 'white-tick.png');
                card.style.backgroundColor = isWhiteTick ? '#FFFFEE' : '#FFFFFF';
            });
        }
    });
    var alertsCards = document.querySelectorAll('.alerts_contents');
    alertsCards.forEach(function (card) {
        var tickImg = card.querySelector('.alerts_contents_head_img img');
        if (tickImg) {
            tickImg.addEventListener('click', function () {
                var isWhiteTick = tickImg.src.includes('white-tick.png');
                tickImg.src = "../quantum-screen-assets/icons/".concat(isWhiteTick ? 'untick.png' : 'white-tick.png');
                card.style.backgroundColor = isWhiteTick ? '#FFFFEE' : '#FFFFFF';
            });
        }
    });
})();
