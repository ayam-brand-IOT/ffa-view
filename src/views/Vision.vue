<template>
    <v-container>
        <div>
        <h1>Configuration: Vision</h1>
    </div>
    <v-row>

    </v-row>
    </v-container>
</template>
<script>
import axios from 'axios';
import config from '@/config';
import { mapState } from 'vuex'
import { mapGetters } from 'vuex'

export default {
    name: 'Vision',
    data() {
        return {
            config: config
        }
    },
    computed: {
        ...mapState({
            // config: state => state.config
        }),
        ...mapGetters({
            // config: 'config'
        })
    },
    methods: {
        getConfig() {
            // axios.get('/api/config')
            //     .then(response => {
            //         this.config = response.data;
            //     })
            //     .catch(error => {
            //         console.log(error);
            //     });
        }
    },
    mounted() {
        // this.getConfig();
    }
}
</script>