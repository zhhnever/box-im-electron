import { defineStore } from 'pinia'
import { getGroupList } from "@api/group";
export const useGroupStore = defineStore('group', {
    state: () => {
        return {
            groups: [],
            activeGroup: null,
        }
    },
    actions: {
        setGroups(groups) {
            this.groups = groups;
        },
        activeGroup(idx) {
            this.activeGroup = this.groups[idx];
        },
        addGroup(group) {
            this.groups.unshift(group);
        },
        removeGroup(groupId) {
            this.groups.forEach((g, idx) => {
                if (g.id == groupId) {
                    this.groups.splice(idx, 1);
                }
            })
            if (this.activeGroup && this.activeGroup.id == groupId) {
                this.activeGroup = null;
            }
        },
        updateGroup(group) {
            this.groups.forEach((g, idx) => {
                if (g.id == group.id) {
                    // 拷贝属性
                    Object.assign(this.groups[idx], group);
                }
            })
        },
        clear() {
            this.groups = [];
            this.activeGroup = null;
        },
        loadGroup() {
            return new Promise((resolve, reject) => {
                getGroupList().then((groups) => {
                    this.setGroups(groups)
                    resolve(groups);
                }).catch((err) => {
                    reject(err);
                })
            });
        }
    }
})
