import {createRouter, createWebHistory} from "vue-router";
import SearchScreen from "@/views/SearchScreen";

const routes = [
    {
        path: "/",
        name: "SearchScreen",
        component: SearchScreen
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    console.log("router", to, from);
    next();
})

export default router;