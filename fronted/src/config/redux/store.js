import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducer/authReducer";

import postReducer from "./reducer/postReducer";

export const store = configureStore({
  reducer: {
    // Add reducers here
    auth: authReducer,
    postReducer: postReducer,
  },
});
