function domReady() {
    let modal = document.getElementsByClassName("modal-container-enc");
    let array = Array.from(modal);
    array.forEach(element => {
        let usr = '';
        let href = element.getAttribute("href");
        href = href + '?country=' + getCountry() + '&utm_source=' + getSite() + getIdAndProduct()+ '&sitio=' + getUrlPath();
        console.log(href);

        let div = document.createElement('div');
        div.setAttribute('class', 'modal-enc fade-enc show-enc');
        div.setAttribute('tabindex', '-1');
        div.setAttribute('aria-modal', 'true');
        div.setAttribute('role', 'dialog');
        div.setAttribute('style', 'display: block;');

        let div2 = document.createElement('div');
        div2.setAttribute('class', 'modal-backdrop-enc fade-enc show-enc');
        div2.addEventListener('click', function() {
            closePopUp(element);
        });

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': 'qualtrics.survey'
        });

        let el = '<div class="modal-dialog-enc modal-lg-enc">' +
            '<div class="modal-content-enc">' +
            '<div class="modal-header-enc">' +
            '<h5 class="modal-title-enc h4" id="modalLgLabel">Queremos conocer tu opini&oacuten</h5>' +
            '<button type="button" class="min" aria-label="Minimize"><img src="/Shared/popup-plugin/assets/min.svg">' +
            '<button type="button" class="max" aria-label="Maximize"><img src="/Shared/popup-plugin/assets/max.svg">' +
            '<button type="button" class="close" data-dismiss="modal-enc" aria-label="Close">' +
            '<span aria-hidden="true">' +
            '<img src="/Shared/popup-plugin/assets/close.svg">' +
            '</span>' +
            '</button>' +
            '</div>' +
            '<div class="modal-body-enc">' +
            '<iframe src="' + href + '" title="Encuesta">' +
            '</div>' +
            '</div>' +
            '</div>';

        div.insertAdjacentHTML('beforeend', el);

        element.appendChild(div)
        element.appendChild(div2);
        let buttons = element.querySelectorAll('button');

        buttons.forEach(btn => {
            if (btn.classList.contains('close')) {
                btn.addEventListener('click', function() {
                    closePopUp(element);
                });
            }
            if (btn.classList.contains('min')) {
                btn.addEventListener('click', function() {                    
                    $(".modal-body-enc").hide("slow");    
                    $(".modal-backdrop-enc").css('height','0'); 
                    $(".modal-enc").addClass("min");
                    $(".modal-enc").removeClass("max");                    
                });
            }
            if (btn.classList.contains('max')) {
                btn.addEventListener('click', function() {                    
                    $(".modal-body-enc").show("slow");
                    $(".modal-backdrop-enc").css('height','100%'); 
                    $(".modal-enc").addClass("max");
                    $(".modal-enc").removeClass("min");  
                });
            }
        });
    });
};

function replaceBody(href, element) {
    let toReplace = element.querySelector('p');
    let replacement = document.createElement('iframe');
    let toRemove = element.querySelectorAll('.modal-footer');
    replacement.setAttribute('src', href);
    replacement.setAttribute('title', 'Encuesta');

    toReplace.parentNode.appendChild(replacement);
    toReplace.parentNode.removeChild(toReplace);

    toRemove.forEach(footer => {
        footer.parentNode.removeChild(footer);
    });
}

function closePopUp(element) {
    element.parentNode.removeChild(element);
}

function checkForCookie() {
    if (localStorage.getItem('popup')) {
        let valid = checkValidDate();
        if (valid) {
            localStorage.removeItem('popup');
            checkForCookie();
        }
    } else {
        let cookie = {
            time: cookieSetTime(),
            value: 'visited'
        };
        localStorage.setItem('popup', JSON.stringify(cookie));
        domReady();
    }
}

function checkValidDate() {
    let cookie = JSON.parse(localStorage.getItem('popup'));
    let date = new Date;
    if (Date.parse(date) > Date.parse(cookie.time)) {
        return true;
    }
    return false;
}

function cookieSetTime() {
    var expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    return expiryDate;
}

function setRandom() {
    let modal = document.getElementsByClassName("modal-container-enc");

    if (modal.length > 0) {
        let array = Array.from(modal);
        array.forEach(element => {
            let users = element.getAttribute("data-user");
            let popup = element.getAttribute("data-popup");
            let number = popup / users;
            let random = Math.random();
            if (random <= number) {
                checkForCookie();
            }
        });
    } else {
        setTimeout(function() {
            setRandom();
        }, 3000);
    }
}

function getCountry() {
    let href = window.location.href;
    let country;

    if (href.indexOf('dtvlaweb') > -1) {
        country = getCountryFromStaging();
    } else if (href.indexOf('.cl') > -1) {
        country = href.split('/')[2].split('.')[2];
    } else {
        country = href.split('/')[2].split('.')[3];
    }

    return country.toUpperCase();
}

function setTime() {
    if (window.location.href.toLowerCase().indexOf('midirectv') > -1) {
        setTimeout(function() {
            setRandom();
        }, 5000);
    } else {
        setTimeout(function() {
            setRandom();
        }, 15000);
    }
}

function getIdAndProduct() {
    if (window.location.href.toLowerCase().indexOf('midirectv') > -1) {
        let custType = '';
        let accNmbr = document.getElementById('hdnMasterAcctNumber').value;
        accNmbr = accNmbr ? '&contactID=' + accNmbr : '';
        let currentType = getCustomerType();

        if (currentType && currentType === 'POST_PAID') {
            custType = '&contactType=POS';
        } else if(currentType && currentType === 'PRE_PAID'){
            custType = '&contactType=PRE';
        } else {
            custType='&contactType=sin datos';
        }

        return accNmbr + custType;
    } else {
        return '&contactType=no-cookie';
    }
}

function getCountryFromStaging() {
    let stgLocation = window.location.href.split('//')[1].split('.')[0];
    let countryCode;

    switch (stgLocation) {
        case "argentina":
            countryCode = "ar";
            break;
        case "chile":
            countryCode = "cl";
            break;
        case "caribbean":
            countryCode = "tt";
            break;
        case "colombia":
            countryCode = "co";
            break;
        case "ecuador":
            countryCode = "ec";
            break;
        case "peru":
            countryCode = "pe";
            break;
        case "puertorico":
            countryCode = "pr";
            break;
        case "uruguay":
            countryCode = "uy";
            break;
        case "venezuela":
            countryCode = "ve";
            break;
        default:
            countryCode = "na";
    }

    return countryCode;
}

function getCustomerType() {
    let currType = 'NA'
    let allcookies = document.cookie;
    let cookieArray = allcookies.split(';');

    for (var i = 0; i < cookieArray.length; i++) {
        cookieName = cookieArray[i].split('=')[0].trim();
        cookieValue = cookieArray[i].split('=')[1].trim();

        if (cookieName == 'DTV.USERTYPE') {
            currType = cookieValue;
            break;
        }
    }

    return currType;
}

function getSite() {
    let href = window.location.href;
    if (href.toLowerCase().indexOf('midirectv') > -1) {
        return 'MDTV';
    } else if (href.toLowerCase().indexOf('ayuda') > -1) {
        return 'CDS';
    } else {
        return 'PS';
    }
}

function getUrlPath() {
    return encodeURIComponent(window.location.pathname);
}

setTime();