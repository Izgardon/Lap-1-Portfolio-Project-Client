//Query selectors

const postBtns = document.querySelectorAll(".form-btn");

const replyModalArea = document.querySelector(".modal-reply-area");

const searchBar = document.querySelector("#site-search");
const searchButton = document.querySelector(".search-button");
const searchResultsArea = document.querySelector("#search-carousel");
const closeSearchBtn = document.querySelector(".close-search");

//Adding all posts that are on server on load

getAllPosts("general");
getAllPosts("attractions");
getAllPosts("places");

//Search list for access anywhere in script

//Event listeners -----------------------------------------------------------------------------------------------------

//Reply Modals

document.addEventListener("click", (e) => {
  submitPostModal(e);
  createReplyModal(e);

  searchAppend(e);
});

closeSearchBtn.addEventListener("click", closeSearch);

//Functions ---------------------------------------------------------------------------

//Creating and Adding new Posts

//Getting all posts on load

function clearAllPosts(dataType) {
  eval(document.querySelector(`.${dataType}-posts`)).innerHTML = "";
}

//Function that deals with appending the posts to the correct carousel page

function append(dataType, post, allData, position) {
  let postNumber = allData.length + 1 - `${position + 1}`;

  let page = Math.ceil(postNumber / 3);

  //First if block is seeing whether it needs to add a new carousel page and then also appends the first new post

  if (postNumber % 3 == 1) {
    document
      .querySelector(`.${dataType}-posts`)
      .insertAdjacentHTML(
        "beforeend",
        `<div class="carousel-item ${
          page == 1 ? "active" : ""
        }  ${dataType}-${page}"></div>`
      );
    document
      .querySelector(`.${dataType}-${page}`)
      .insertAdjacentHTML("beforeend", returnPost(dataType, post));
  }

  //Else statement deals with just adding new posts to current carousel page
  else {
    document
      .querySelector(`.${dataType}-${page}`)
      .insertAdjacentHTML("beforeend", returnPost(dataType, post));
  }
}

function getAllPosts(dataType) {
  fetch(`https://london-travel.herokuapp.com/${dataType}`)
    .then((r) => r.json())
    .then((allPostData) => {
      for (let i = allPostData.length; i >= 1; i--) {
        append(
          dataType,
          allPostData[i - 1],
          allPostData,
          allPostData.indexOf(allPostData[i - 1])
        );
      }
    })
    //Adding the emoji buttons so timeout function works
    .then(() => {
      addEmojiClicks();
    });
}

//Adding a new post

function submitPostModal(e) {
  if (e.target.classList.contains("form-btn")) {
    e.preventDefault();
    let dataType = e.target.id;
    let title = document.querySelector(`.${dataType}-title`).value;
    let body = document.querySelector(`.${dataType}-body`).value;
    if (title && body) {
      const postData = {
        title: title,
        body: body,
        reactions: [0, 0, 0],
        replies: [],
      };

      postNewPost(dataType, postData);

      document.querySelector(`.${dataType}-title`).value = "";
      document.querySelector(`.${dataType}-body`).value = "";
    } else {
      setTimeout(() => {
        document.querySelector(`#${dataType}-button`).click();
      }, 400);
    }
  }
}

function postNewPost(dataType, post) {
  const options = {
    method: "POST",
    body: JSON.stringify(post),
    headers: {
      "Content-Type": "application/json",
    },
  };
  fetch(`https://london-travel.herokuapp.com/${dataType}`, options)
    .then((r) => r.json())
    .catch(console.warn);

  setTimeout(() => {
    clearAllPosts(dataType);
    getAllPosts(dataType);
  }, 100);
}

//Adding emoji counter

function addEmojiClicks() {
  const emojiButtons = document.querySelectorAll(".reaction-button");
  emojiButtons.forEach((btn) => {
    btn.addEventListener("click", emojiCounter);
  });
}

function emojiCounter(e) {
  let button = e.target;
  let dataType = button.id.split("*")[0];
  let postId = button.id.split("*")[1];
  let emojiId = button.id.split("*")[2];

  document.getElementById(e.target.id).childNodes[1].textContent++;
  button.removeEventListener("click", emojiCounter);
  setTimeout(() => {
    button.addEventListener("click", emojiCounter);
  }, 2000);

  const options = {
    method: "PATCH",
    body: JSON.stringify({
      reactions: emojiId,
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  };

  fetch(`https://london-travel.herokuapp.com/${dataType}/${postId}`, options);
}

//Adding the reply modal

function createReplyModal(e) {
  if (e.target.classList.contains("reply-button")) {
    replyModalArea.innerHTML = "";

    let dataType = e.target.id.split("-")[0];
    let postId = e.target.id.split("-")[1];

    fetch(`https://london-travel.herokuapp.com/${dataType}/${postId}`)
      .then((r) => r.json())
      .then((postData) => {
        replyModalArea.insertAdjacentHTML(
          "afterbegin",
          returnReplyModal(postData, dataType, postId)
        );
        postData.replies.forEach((reply) => {
          document
            .querySelector(".modal-reply-body")
            .insertAdjacentHTML(
              "afterbegin",
              `<div class="reply">${reply}</div>`
            );
        });
        addingGifs(dataType, postId);
        document
          .querySelector(`#${dataType}-${postId}-reply-button`)
          .addEventListener("click", (e) => {
            sendReply(e);
            document.querySelector(".replyMessageBox").value = "";
          });
      });
  }
}

//Function for sending replies ------------------------------------------------------------------------

function sendReply(e, isGif = "no", gifDataType, gifPostId) {
  let reply = "";
  let dataType = "";
  let postId = "";
  if (isGif == "no") {
    dataType = e.target.id.split("-")[0];
    postId = e.target.id.split("-")[1];

    reply = document.querySelector(`#${dataType}-${postId}-reply-box`).value;
  } else if (isGif == "yes") {
    reply = `<img src="${e.target.src}" alt="Cool Gif">`;
    dataType = gifDataType;
    postId = gifPostId;
  }

  document
    .querySelector(".modal-reply-body")
    .insertAdjacentHTML("beforeend", `<div class="reply">${reply}</div>`);
  const options = {
    method: "PATCH",
    body: JSON.stringify({
      reply: reply,
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  };

  fetch(`https://london-travel.herokuapp.com/${dataType}/${postId}`, options);
}

//Sending gifs (calls the sendReply function and modifies it for gifs)

//Giphy
const APIKEY = "D1iipyMQItHYCfLcRNkam36gNXOSaSm5";

function addingGifs(dataType, postId) {
  let gifSearch = document.getElementById("gifSearch");
  let displayGiphy = document.querySelector(".displayGiphy");
  let gifSearchBox = document.querySelector(".gifSearchBox");
  gifSearch.addEventListener("click", function gifClick(e) {
    if (gifSearchBox.value) {
      gifSearch.removeEventListener("click", gifClick);

      let url = `https://api.giphy.com/v1/gifs/search?api_key=${APIKEY}&limit=5&q=`;
      let str = document.getElementById("search").value.trim();
      url = url.concat(str);

      fetch(url)
        .then((resp) => resp.json())
        .then((content) => {
          content.data.forEach((data) => {
            let fig = document.createElement("figure");
            let img = document.createElement("img");
            img.src = data.images.fixed_height_small.url;
            img.alt = "gif";
            fig.appendChild(img);
            displayGiphy.insertAdjacentElement("afterbegin", fig);
          });
        })
        .catch((err) => {
          console.error(err);
        });

      document.addEventListener("click", function gifSelector(e) {
        if (e.target.getAttribute("alt") == "gif") {
          sendReply(e, "yes", dataType, postId);
          displayGiphy.innerHTML = "";
          gifSearchBox.value = "";
          gifSearch.addEventListener("click", gifClick);
          document.removeEventListener("click", gifSelector);
        }
      });
    }
  });
}

//Search bar

//Function for button that closes the search area
function closeSearch(e) {
  searchResultsArea.classList.add("search-hidden");
  clearAllPosts("search");
  closeSearchBtn.classList.add("search-hidden");
}
//This function appends the items that match the seach criteria into the new search

function searchAppend(e) {
  if (e.target.classList.contains("search-button")) {
    e.preventDefault();
    let searchTerm = searchBar.value.toLowerCase();
    let results = [];
    let searchList = [];

    clearAllPosts("search");
    searchData(searchList);

    setTimeout(() => {
      for (let i = searchList.length - 1; i >= 0; i--) {
        if (searchList[i].title.toLowerCase().includes(searchTerm)) {
          results.push(searchList[i]);
        }
      }

      searchList = [];
      closeSearchBtn.classList.add("search-hidden");
      searchResultsArea.classList.add("search-hidden");

      if (results[0]) {
        closeSearchBtn.classList.remove("search-hidden");
        searchResultsArea.classList.remove("search-hidden");
        searchBar.value = "";

        results.forEach((result) =>
          append(
            "search",
            result,
            results,
            results.length - 1 - results.indexOf(result)
          )
        );
        addEmojiClicks();
      }
    }, 200);
  }
}

//This Async function collects all the data from all our data sets and pushes it into one array

async function searchData(searchList) {
  try {
    let responseG = await fetch("https://london-travel.herokuapp.com/general");

    let generalData = await responseG.json();
    generalData.forEach((post) => {
      searchList.push(post);
    });

    let responseP = await fetch("https://london-travel.herokuapp.com/places");

    let placesData = await responseP.json();

    placesData.forEach((post) => {
      searchList.push(post);
    });

    let responseA = await fetch(
      "https://london-travel.herokuapp.com/attractions"
    );

    let attractionsData = await responseA.json();

    attractionsData.forEach((post) => {
      searchList.push(post);
    });
  } catch (err) {
    console.log(err);
  }
}

//HTML returner functions -----------------------------------------------------------------------

//Returning a post

function returnPost(dataType, post) {
  return ` <div class="card main-card m-3"  style="width: 18rem;">
                            
    <div class="card-body">

    <div class="card-post">
      <h5 class="card-title">${post.title}</h5>
      <p class="card-text">${post.body}</p>

      <button class="btn card-button reply-button" id="${post.type}-${post.id}" data-bs-toggle="modal" data-bs-target="#reply-modal">View the Discussion</button>
    </div>

    <div class="card-reactions">
      <button type="button" class="btn position-relative reaction-button" id="${post.type}*${post.id}*1">

      &#127913
      <span class="position-absolute top-100 translate-middle badge rounded-pill bg-danger emo-count">
      ${post.reactions[0]}
      </span>
      </button>

      <button type="button" class="btn position-relative reaction-button" id="${post.type}*${post.id}*2">
      &#128077
      <span class="position-absolute top-100 translate-middle badge rounded-pill bg-danger emo-count">
      ${post.reactions[1]}
      </span>
      </button>

      <button type="button" class="btn position-relative reaction-button" id="${post.type}*${post.id}*3">
      &#128078
      <span class="position-absolute top-100 translate-middle badge rounded-pill bg-danger emo-count">
      ${post.reactions[2]}
      </span>
      </button>
    </div>
    </div>
</div>
`;
}

function returnReplyModal(postData, dataType, postId) {
  return `
  <div class="modal-header">
    <h5 class="modal-title" >${postData.title}</h5>
    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
  </div>
  <h5 class="reply-modal-title">Original Post:</h5>
  <div class="modal-body-post">${postData.body}</div>
  <h5 class="reply-modal-title">Reply Section:</h5>
  <div class="modal-body modal-reply-body">
  </div>
  <label for="reply-text" class="col-form-label"></label>
  <textarea class="form-control replyMessageBox attractions-body" rows="3" style="max-width: 600px; margin-inline:auto;" maxlength="150" id="${postData.type}-${postId}-reply-box" placeholder="Enter Reply..." required></textarea>

  <form class="gif-searcher" onkeydown="return event.key != 'Enter';">
  
  <input class= "gifSearchBox" type="search" id="search" placeholder="Search for GIF">
  <button id="gifSearch" onclick="event.preventDefault()" class="btn nav-button gif-button">Search</button>
  </form>
  
  <div class="displayGiphy"></div>
  <form>

  <button type="button" id="${postData.type}-${postId}-reply-button"  class="form-btn btn nav-button send-reply-button">Send reply</button>
  </form>
  <div class="modal-footer">
  
  </div>
  
`;
}

module.exports = postNewPost;
module.exports = getAllPosts;
module.exports = returnPost;
module.exports = returnReplyModal;
// module.exports = append;
