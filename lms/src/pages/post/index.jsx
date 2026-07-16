import {useState} from "react";
import styles from "./styles.module.scss";
import {useDropdown} from "./useDropDown";
import NewPostModal from "../../sections/chat/post-main-component/NewPostModal";

const Post = () => {
  const categories = [
    {label: "Homework", color: "bg-sky-400"},
    {label: "Lab Manual", color: "bg-green-400"},
    {label: "Course Slides", color: "bg-pink-400"},
    {label: "Term Project", color: "bg-yellow-400"},
    {label: "Textbook", color: "bg-red-400"}
  ];
  const postContentCategories = [
    "Q&A",
    "Resources",
    "Statistics",
  ];
  const sortOptions = [
    "Latest",
    "Hottest",
    "Highlights"
  ];
  const [selectedPostContentCategory, setSelectedPostContentCategory] = useState(postContentCategories[0]);
  const [selectedCategory, setSelectedCategory] = useState(categories[0].label);
  const [selectedSort, setSelectedSort] = useState("Sort");
  const sortDropdown = useDropdown();
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const handleSortSelect = (item) => {
    setSelectedSort(item);
    sortDropdown.close();
  };
  const postTemplate =
    {
      title: "TCP mode measurement",
      time: "12:14 PM",
      postType: "Question",
      body: "In this course, we'll be teaching the concepts of the JavaScript programming language and the cool functions you can use with it in the ProcessingJS library. Before you dig in, here's a brief tour of how we teach...",
      instructor: {
        name: "Sylvia Reyes",
        role: "Instructor",
        image: "icons/course/instructor.png",
      },
      postId: "1",
      stats: {
        likes: 12,
        comments: 5,
        shares: 5,
      },
    }
  const posts = Array(8).fill(null).map(() => ({...postTemplate}));
  return (
    <div className="flex items-center justify-center">
      {/* Post Header */}
      <div className="flex items-center justify-center gap-4 mt-10">
        {postContentCategories.map((item, index) => (
          <div className="flex items-center gap-2" key={index}>
                            <span className={`text-[1.1rem] font-medium text-[rgba(45,55,72,1)] cursor-pointer border-b-2
                                ${selectedPostContentCategory === item ? "border-[rgba(86,111,232,1)]" : "border-transparent"}`}
                                  onClick={() => setSelectedPostContentCategory(item)}>{item}</span>
          </div>
        ))}
      </div>
      {/* Post Categories */}
      <div className="mt-5 flex flex-row justify-between w-full px-10">
        {/* Sort Dropdown */}
        <div ref={sortDropdown.ref}
             className="relative cursor-pointer flex items-center gap-2 border-1 border-[rgba(203,213,224,1)] hover:bg-[rgba(226,232,240,1)] rounded-lg px-4 py-1">
          <div className="flex items-center gap-2" onClick={sortDropdown.toggle}>
            <span className="text-[1rem] text-[rgba(45,55,72,1)]">{selectedSort}</span>
            <img src="icons/posts/arrow-down-v2.png" alt="arrow-down"/>
          </div>
          {sortDropdown.isOpen && (
            <div className="absolute mt-43 left-0 w-40 rounded-md shadow-lg bg-white ring-1 ring-black/5 z-10">
              {sortOptions.map((item, index) => (
                <div key={index} className="cursor-pointer px-4 py-2 hover:bg-gray-100 text-primary-color"
                     onClick={() => handleSortSelect(item)}>{item}</div>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.spacer}/>
        <div className={styles.postHeaderSearch}>
          <img src="icons/search.png" alt="search"/>
          <input type="text" placeholder="Search"/>
        </div>
        <button
          className="flex items-center gap-2 ml-3 px-4 py-1 bg-[rgba(86,111,232,1)] cursor-pointer text-white rounded-lg font-medium text-sm hover:bg-[rgba(86,111,232,0.8)] transition"
          onClick={() => setShowNewPostModal(true)}
        >
          <span className="text-lg">+</span>
          <span>New Post</span>
        </button>
      </div>
      <div className="flex items-flex-start gap-8">
        {/* Post Categories */}
        {categories.map((item) => (
          <div
            key={item.label}
            className={`flex items-center space-x-3 px-2 py-3 rounded-xl cursor-pointer hover:bg-[rgba(226,232,240,1)] ${
              selectedCategory === item.label ? "bg-[rgba(226,232,240,1)]" : ""
            }`}
            onClick={() => setSelectedCategory(item.label)}
          >
            <span className={`w-3 h-3 rounded-full ${item.color}`}/>
            <span className="text-gray-800 font-medium tracking-tight">
                        {item.label}
                    </span>
          </div>
        ))}
        <div
          className="relative cursor-pointer flex items-center gap-2 border-1 border-[rgba(203,213,224,1)] hover:bg-[rgba(226,232,240,1)] rounded-lg px-4 py-1">
          <div className="flex items-center gap-2">
            <span className="text-[1rem] text-[rgba(45,55,72,1)]">All</span>
            <img src="icons/posts/arrow-down-v2.png" alt="arrow-down"/>
          </div>
        </div>
      </div>
      <NewPostModal open={showNewPostModal} onClose={() => setShowNewPostModal(false)}/>
    </div>
  )
}

export default Post;
