import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  actAddPost,
  actDeletePost,
  actEditPost,
  actLoadPosts,
} from "../../redux/actions/postsActions";
import { shuffleArr } from "../../utils/commonFunctions";
import Pagination from "../Base/Pagination";
import PostsAdd from "./PostsAdd";
import PostsAddItem from "./PostsAddItem";
import PostsDelete from "./PostsDelete";
import PostsEdit from "./PostsEdit";
import PostsItem from "./PostsItem";
import PostsItemSkeleton from "./PostsItemSkeleton";
import PostsUserRanking from "./PostsUserRanking";

const ITEM_PER_PAGE = 6;
const inputPost = { id: "", title: "", description: "" };

export default function Posts() {
  const { t } = useTranslation("common");

  // Next
  const router = useRouter();
  const { page = 1, q = "", filter } = router.query;

  // Redux
  const dispatch = useDispatch();
  const selectorPosts = useSelector((state) => state.posts);
  const postsBase = selectorPosts?.posts;
  const authSelector = useSelector((state) => state.auth);
  const user = authSelector?.user;

  // State React
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [postsTotal, setPostsTotal] = useState(postsBase.length);
  const [postSelected, setPostSelected] = useState(inputPost);

  // Effect
  useEffect(() => {
    (async () => {
      await dispatch(actLoadPosts());
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    let postsData = [...postsBase].filter((o) =>
      o.title.toLowerCase().includes(q.toLowerCase())
    );
    setPostsTotal(postsData.length);
    postsData = postsData.splice((page - 1) * ITEM_PER_PAGE, ITEM_PER_PAGE);
    if (filter === "random") {
      postsData = shuffleArr(postsData);
    }
    setPosts(postsData);
  }, [page, q, postsBase, filter]);

  // Functions
  const onChange = (e) => {
    const { name, value } = e.target;
    setPostSelected({ ...postSelected, [name]: value });
  };

  const onAddPost = async (e) => {
    e.preventDefault();
    const { title, description } = postSelected;
    if (title.length === 0 || description.length === 0) {
      return toast.warning(t("app.toast.requiredInput"));
    }

    // request and close modal
    await dispatch(actAddPost({ ...postSelected, user_id: user?.id }, t));
    setPostSelected(inputPost);
    document.querySelector("#addModal button[data-dismiss='modal']").click();
  };

  const onEditPost = async (e) => {
    e.preventDefault();

    if (postSelected?.user_id !== user?.id) {
      return;
    }

    const { title, description } = postSelected;
    if (title.length === 0 || description.length === 0) {
      return toast.warning(t("app.toast.requiredInput"));
    }

    // request and close modal
    await dispatch(actEditPost({ ...postSelected, user_id: user?.id }, t));
    setPostSelected(inputPost);
    document.querySelector("#editModal button[data-dismiss='modal']").click();
  };

  const onDeletePost = async (e) => {
    e.preventDefault();

    if (postSelected?.user_id !== user?.id) {
      return;
    }

    // request and close modal
    await dispatch(actDeletePost(postSelected, t));
    setPostSelected(inputPost);
    document.querySelector("#deleteModal button[data-dismiss='modal']").click();
  };

  const showPageItem = q === "" && parseInt(page) === 1;

  // Render
  return (
    <div className="row mt-4">
      <PostsAdd
        postSelected={postSelected}
        onChange={onChange}
        onAddPost={onAddPost}
      />
      <PostsEdit
        postSelected={postSelected}
        onChange={onChange}
        onEditPost={onEditPost}
      />
      <PostsDelete postSelected={postSelected} onDeletePost={onDeletePost} />
      {q.length > 0 && (
        <h2 className="w-100 text-center text-uppercase mb-3">
          {t("app.common.searchTitle")} "{q}".
        </h2>
      )}
      <div className={`${showPageItem ? "col-md-5" : "col-md-12"}`}>
        <PostsAddItem user={user} />
      </div>
      <div className={`col-md-7 ${!showPageItem && "d-none"} mb-4 mb-md-5`}>
        <PostsUserRanking posts={postsBase} />
      </div>
      {[...Array(6).keys()].map((item) => (
        <div key={item} className={`col-md-6 ${isLoading ? "" : "d-none"}`}>
          <PostsItemSkeleton />
        </div>
      ))}
      {posts.map((post) => (
        <div key={post.id} className={`col-md-6 ${isLoading ? "d-none" : ""}`}>
          <PostsItem
            user={user}
            post={post}
            onSelectPost={() => setPostSelected(post)}
          />
        </div>
      ))}
      <div className="col-md-12">
        {(posts.length > 0 && filter !== "random") && (
          <Pagination
            baseUrl="/posts"
            maxSize={postsTotal}
            itemSize={ITEM_PER_PAGE}
          />
        )}
      </div>
    </div>
  );
}
