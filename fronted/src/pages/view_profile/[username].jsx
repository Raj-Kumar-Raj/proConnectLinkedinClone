import { BASE_URL, clientServer } from "@/config";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import styles from "./index.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { getAllPosts } from "@/config/redux/action/postAction";
import {
  sendConnectionRequest,
  getConnectionsRequest,
  getMyConnectionRequests,
} from "@/config/redux/action/authAction";

export default function ViewProfilePage({ userProfile, error }) {
  const router = useRouter();
  const postReducer = useSelector((state) => state.postReducer);
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth) ?? {};
  const connections = authState.connections ?? [];
  const connectionRequests = authState.connectionRequest ?? [];

  const [userPosts, setUserPosts] = useState([]);
  const [isCurrentUserInConnection, setIsCurrentUserInConnection] =
    useState(false);
  const [isConnectionNull, setIsConnectionNull] = useState(true);

  const getUsersPost = async () => {
    await dispatch(getAllPosts());
  };

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to send a connection request.");
        return;
      }

      // Ensure user is not already connected or has a pending request
      const isAlreadyConnected = connections.some(
        (user) => user.connectionId._id === userProfile.userId._id
      );

      const isAlreadyRequested = connectionRequests.some(
        (user) => user.userId._id === userProfile.userId._id
      );

      if (isAlreadyConnected || isAlreadyRequested) {
        alert("You have already sent a request or are already connected.");
        return;
      }

      // Send the request if not already sent
      await dispatch(
        sendConnectionRequest({
          token: token,
          user_id: userProfile.userId._id,
        })
      );

      setIsCurrentUserInConnection(true);
      setIsConnectionNull(true);

      // Refresh connection requests after sending
      await dispatch(getConnectionsRequest({ token }));
      await dispatch(getMyConnectionRequests({ token }));

      alert("Connection request sent!");
    } catch (error) {
      console.error("Error sending connection request:", error);
      alert("Failed to send connection request. Please try again.");
    }
  };

  useEffect(() => {
    let post = postReducer.posts.filter((post) => {
      return post.userId.username === router.query.username;
    });
    setUserPosts(post);
  }, [postReducer.posts]);

  useEffect(() => {
    if (connections.length > 0 || connectionRequests.length > 0) {
      const userConnection = connections.some(
        (user) => user.connectionId._id === userProfile.userId._id
      );

      if (userConnection) {
        setIsCurrentUserInConnection(true);
        const foundConnection = connections.find(
          (user) => user.connectionId._id === userProfile.userId._id
        );
        setIsConnectionNull(!foundConnection?.status_accepted); // Check if status is NOT accepted (pending)
      }

      const pendingRequest = connectionRequests.find(
        (user) => user.userId._id === userProfile.userId._id
      );

      if (pendingRequest) {
        setIsCurrentUserInConnection(true);
        setIsConnectionNull(!pendingRequest?.status_accepted); // Mark as pending if not accepted
      }
    }
  }, [connections, connectionRequests]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(getConnectionsRequest({ token }));
      dispatch(getMyConnectionRequests({ token }));
    }
  }, [dispatch]);

  useEffect(() => {
    getUsersPost();
  }, [dispatch]);

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.container}>
          <div className={styles.backDropContainer}>
            <img
              className={styles.backDrop}
              src={`${BASE_URL}/${userProfile.userId.profilePicture}`}
              alt="backdrop"
            />
          </div>
          <div className={styles.profileContainer_details}>
            <div className={styles.profileContainer_flex}>
              <div style={{ flex: "0.8" }}>
                <div
                  style={{
                    display: "flex",
                    width: "fit-content",
                    alignItems: "center",
                    gap: "1.2rem",
                  }}
                >
                  <h2>{userProfile.userId.name}</h2>
                  <p style={{ color: "grey" }}>
                    @{userProfile.userId.username}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.2rem",
                  }}
                >
                  {isCurrentUserInConnection ? (
                    <button className={styles.connectedButton}>
                      {isConnectionNull ? "pending" : "connected"}
                    </button>
                  ) : (
                    <button
                      onClick={handleConnect}
                      className={styles.connectBtn}
                    >
                      Connect
                    </button>
                  )}

                  <div
                    onClick={async () => {
                      const response = await clientServer.get(
                        `/user/download_resume?id=${userProfile.userId._id}`
                      );
                      window.open(
                        `${BASE_URL}/${response.data.message}`,
                        "_blank"
                      );
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <svg
                      style={{ width: "1.2rem" }}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                  </div>
                </div>

                <div>
                  <p>{userProfile.bio}</p>
                </div>
              </div>
              <div style={{ flex: "0.2" }}>
                <h3>Recent Activity</h3>
                {userPosts.map((post) => {
                  return (
                    <div key={post._id} className={styles.postCard}>
                      <div className={styles.card}>
                        <div className={styles.card_profileContainer}>
                          {post?.media ? (
                            <img src={`${BASE_URL}/${post.media}`} alt="" />
                          ) : (
                            <div
                              style={{ width: "3.4rem", height: "3.4rem" }}
                            ></div>
                          )}
                        </div>
                        <p>{post.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="workHistory">
            <h4>Work History</h4>
            <div className={styles.workHistoryContainer}>
              {userProfile.pastWork.map((work, index) => {
                return (
                  <div key={index} className={styles.workHistoryCard}>
                    <div>
                      <p
                        style={{
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.8rem",
                        }}
                      >
                        {work.company}-{work.position}
                      </p>
                      <p>Duration-{work.years}years</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="workHistory">
            <h4>Education</h4>
            <div className={styles.workHistoryContainer}>
              {userProfile.education.map((education, index) => {
                return (
                  <div key={index} className={styles.workHistoryCard}>
                    <div>
                      <p
                        style={{
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.8rem",
                        }}
                      >
                        School:-{education.school}, Degree:-{education.degree}
                      </p>
                      <p>Field Of Study:-{education.fieldOfStudy}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    if (!context.query.username) {
      return {
        props: {
          userProfile: null,
          error: "Username is missing in the request.",
        },
      };
    }

    const response = await clientServer.get(
      "/user/get_profile_based_on_username",
      {
        params: { username: context.query.username },
      }
    );

    return {
      props: { userProfile: response.data.profile || null, error: null },
    };
  } catch (error) {
    console.error(
      "Error fetching profile:",
      error.response?.data || error.message
    );

    return {
      props: {
        userProfile: null,
        error: error.response?.data?.message || "Failed to fetch user profile.",
      },
    };
  }
}
