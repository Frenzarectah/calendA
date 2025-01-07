const app = Vue.createApp({
    data() {
        return {
            name:"CalendA",
            days: [  {
                'num':null,
                'class': 'empty',
                'events': []
            }],
            literalMonth: {
                '1': 'Gennaio',
                '2': 'Febbraio',
                '3': 'Marzo',
                '4': 'Aprile',
                '5': 'Maggio',
                '6': 'Giugno',
                '7': 'Luglio',
                '8': 'Agosto',
                '9': 'Settembre',
                '10': 'Ottobre',
                '11': 'Novembre',
                '12': 'Dicembre'
            },
            today: new Date().getDate(),
            year: null,
            month: null,
            firstDayOfMonth: null,
            daysInMonth: null,
            startDay: null,
            currentTime: null,
            token:"",
            sala_grande: [],
            sala_piccola: [],
            isMeetingRunning: false,
            current_event: []
        };
    },
    template:`
               <div id="container" xmlns="http://www.w3.org/1999/html">
                 <header :class="['head', isMeetingRunning ? 'running' : 'not_running']">
                     <img class="header_image" src="sinergia_bianco.png">
                     <div v-if="!isMeetingRunning" class="header_date">{{ today }} {{ literalMonth[month] }} {{ year }}</div>
                     <div v-else class="header_date small"> EVENTO IN CORSO <br> {{ current_event['subject'] }}  {{ current_event['start'] }} - {{ current_event['end'] }}</div>
                     <div class="header_date"> {{ currentTime }}</div>
                 </header>
                <div class="legenda">
                    <div><span class="grande_box">@</span> Sala grande</div>  
                    <div><span class="piccola_box">@</span> Sala piccola</div>
                </div>
                <div class="calendar">
                    <div v-for="day in days" :key="day.num" :class="[ 'day', isWeekend(day.num) ? 'weekend' : '']">
                    <div :class="day.class"> {{ day.num }}</div>
                    <div v-for="event in day.events" :class="event.class"> 
                        <span>{{ event.subject }}</span><span>{{ event.start}}-{{ event.end }}</span>
                    </div>
                </div>
                </div>
                </div>
            `,
    mounted() {
        const now = new Date();
        this.year = now.getFullYear();
        this.month = now.getMonth()+1;
        this.today = now.getDate();
        this.firstDayOfMonth = new Date(this.year, this.month, 1);
        this.daysInMonth = new Date(this.year, this.month, 0).getDate();
        this.startDay = (this.firstDayOfMonth.getDay() + 5) % 7;
        this.updateTime();
        setInterval(this.updateTime, 1000);
        this.get_Meetings();
        setInterval(function() {
            window.location.reload();
        }, 300000);
    },
    watch:{
        'days': {
            handler(newVal) {
                const now = new Date();
                const formattedDate = now.toString().substring(0, 21); // Ottieni solo la data nel formato YYYY-MM-DD
                this.isMeetingRunning = newVal.some(day => {
                        if (day.events) {
                            const running_event = day.events.find(event => event.class==='grande' && formattedDate >= event.dateStart && formattedDate <= event.dateEnd)
                            if (running_event) {
                                this.current_event = running_event;
                                return true;
                            }
                        }
                    return false;
                });
            },
            deep: true
        }
    },
    methods: {
        isWeekend(day){
            let dayofWeek = (new Date(this.year,this.month-1, day).getDay());
            return dayofWeek === 0 || dayofWeek === 6;
        },
        generateDays() {
            this.days = [];

            for (let i = 1; i < this.startDay; i++) { //caselle vuote
                this.days.push({ num: '', class: 'empty' });
            }
            for (let day = 1; day <= this.daysInMonth; day++) {  //caselle in cui c'è eventi rossi/blu o oggi
                let _day = day.toString().padStart(2, '0');
                let dayClass = '';
                let events = [];

                const grande = this.sala_grande.filter(event => event.day === _day);
                const piccola = this.sala_piccola.filter(event => event.day === _day);

                grande.forEach(grande => {
                    events.push({
                        subject: grande.subject,
                        start: grande.start.substring(16, 21),
                        end: grande.end.substring(16, 21),
                        dateStart: grande.start,
                        dateEnd: grande.end,
                        class: 'grande'
                    });
                });

                piccola.forEach(piccola =>{
                    events.push({
                        subject: piccola.subject,
                        start: piccola.start.substring(16, 21),
                        end: piccola.end.substring(16, 21),
                        dateStart: piccola.start,
                        dateEnd: piccola.end,
                        class: 'piccola'
                    });
                });

                (day === this.today) ? dayClass += ' today' : dayClass += 'everyday';

                this.days.push({ num: day, class: dayClass, events: events });
            }
        },
        updateTime() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            this.currentTime = `${hours}:${minutes}`;
        },
        async lime_login(){
            let data = JSON.stringify({
                "email": "staging@grupposinergia.com",
                "password": "Pa$$woRd?123"
            });

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://lime.grupposinergia.net/api/login',
                headers: {
                    'Content-Type': 'application/json'
                },
                data : data
            };


            try {
                const response = await axios.request(config);
                return response.data.token;
            } catch (error) {
                console.log(error);
                return null;
            }
        },
        async get_Meetings(){
            let token = await this.lime_login();
            if (!token) {
                console.log("Failed to retrieve token");
                return;
            }
            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: 'https://lime.grupposinergia.net/api/v2/all_meetings',
                headers: {
                    'Content-Type': 'application/json',
                    'company-code': 'XX',
                    'Authorization': `Bearer ${token}`
                }
            };

            axios.request(config)
                .then((response) => {
                    this.sala_grande = response.data.meetings.Sala_Grande;
                    this.sala_piccola = response.data.meetings.Sala_Piccola;
                    this.generateDays();
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    }
});

app.mount('#calenda');