import { defineStore } from 'pinia'
import { useConfigStore } from "@store/config";
import { useFriendStore } from "@store/friend";
import { useChatStore } from "@store/chat";
import { useGroupStore } from "@store/group";
import { useUserStore } from "@store/user";


export const useIndexStore = defineStore('index', {
    actions: {
        load() {
            const userStore = useUserStore()
            return userStore.loadUser().then(() => {
                const configStore = useConfigStore()
                const chatStore = useChatStore()
                const friendStore = useFriendStore()
                const groupStore = useGroupStore()
                const promises = [];
                promises.push(friendStore.loadFriend());
                promises.push(groupStore.loadGroup());
                promises.push(chatStore.loadChat());
                promises.push(configStore.loadConfig());
                return Promise.all(promises);
            })
        },
        unload() {
            // context.commit("clear");
        }
    },
})
