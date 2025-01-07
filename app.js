const app = Vue.createApp({
    data() {
        return {
            name:"CalendA",
            days: [  {                //this are the basic variables and objects for the project
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
            sala_grande: [],            //this 2 objects are used to store the "sala_grande (big room)" and "sala piccola (small room)" meetings
            sala_piccola: [],
            isMeetingRunning: false,    //a flag used to sign if a meeting is currently running in the specific "now" moment
            current_event: []           //current event is an object to store the information about the running meeting (above descripted)
        };
    },
    //this is the template dinamically created according to the days of the current month, some details changes if an event is running
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
        setInterval(this.updateTime, 1000);        //this for updating the clock every minute
        this.get_Meetings();        //used to check the microsoft API for new meetings
        setInterval(function() {
            window.location.reload();    //the webapp needs to re-render the entire template to list the brand new meetings
        }, 300000);
    },
    watch:{
        'days': {                        //using a watch to check if there's a running event every time a days is rendered
            handler(newVal) {
                const now = new Date();
                const formattedDate = now.toString().substring(0, 21); // Force the today data format to be formatted -> YYYY-MM-DD
                this.isMeetingRunning = newVal.some(day => {
                        if (day.events) {
                            const running_event = day.events.find(event => event.class==='grande' && formattedDate >= event.dateStart && formattedDate <= event.dateEnd)
                            if (running_event) {       
                                this.current_event = running_event; //populate the current_event with the event which has same times as now (formattedDate)
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
        isWeekend(day){            //check if the day to render is sunday or saturday 
            let dayofWeek = (new Date(this.year,this.month-1, day).getDay());
            return dayofWeek === 0 || dayofWeek === 6;
        },
        generateDays() {
            this.days = [];

            for (let i = 1; i < this.startDay; i++) {     //empty cells
                this.days.push({ num: '', class: 'empty' });
            }
            for (let day = 1; day <= this.daysInMonth; day++) { //check if in the day there are some meetings, and add a class to render them in
                let _day = day.toString().padStart(2, '0');     //the corrispondent cell
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
        async lime_login(){                        //these are some endpoint for my proxy API which communicates with microsoft graph
            let data = JSON.stringify({            //for security issue, it will be not listed/explained in this repo.
                "email": *removed*,
                "password": *removed*
            });

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://*removed*/api/login',
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
                url: 'https://*removed*/api/v2/all_meetings',
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
