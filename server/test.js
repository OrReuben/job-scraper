// const str = '• Proven experience as a Webmaster or Web Developer • Knowledge of web analytics and SEO • Familiarity with web standards • Working knowledge of website management tools • Proficient in C#,HTML/CSS, XML; knowledge of SQL and Javascript is preferred • Strong troubleshooting and analytical abilities • Excellent communication and teamwork skills • Ability to generate creative ideas • Attention to detail and outstanding organizational skills • BSc/BA in Computer Science'
// const regex = /(?<=^|\s)(?:[01](?:\+?(?:\syears)?)?|אפס|שנה|one|zero)(?=\s|$)/;
const strArr = [
  "Job for שנתיים 1 years experience",
  "HTML5 CSS3",
  "",
  "ניסיון של 3 שנים ומעלה hands-on ב",
  "השכלה רלוונטית בתחום.  ניסיון של לפחות כשנתיים כראש צוות של מפתחי fullstack web ( ניהול מקצועי ואישי)  ניסיון של 3 שנים ומעלה hands-on ב .net core  C# 4 ומעלה  כתיבת שירותי rest  HTML5 CSS3  Angular 6+  ניסיון של שנה מול וידע בכתיבת שאילתות    SQL SERVR  MONGO DB",
];
const regex1 = /(?:(?<=\s)|^)(?:3|4|5|6|7|שלוש|ארבע|חמש|שש|שבע)(?:(?=\s)|$)|(?:(?<=\D)|^)[3-7](?:(?=\D)|$)/;
const regex2 = /(?:(?<=\s)|^)(?:2|two|שנתיים|שתי|שני)(?:(?=\s)|$)|(?:(?<=\D)|^)[2-2](?:(?=\D)|$)/;
const regex3 = /(?:(?<=\s)|^)(?:1|0|שנה|שנת|one)(?:(?=\s)|$)|(?:(?<=\D)|^)[0-1](?:(?=\D)|$)/;


const newArr = strArr.filter((item) => {
  if (regex1.test(item)) {
    return false;
  } else if (regex2.test(item)) {
    if (regex3.test(item)) {
      return true;
    }
    return false;
  } else if (regex3.test(item)) {
    return true;
  }
});
// console.log(newArr);

 
// const pattern = /(?:(?<=\s)|^)(?:senior|ראש|סניור|בוגר|מומחה|מנהל|הנדסאי)(?:(?=\s)|$)|(?:(?<=\D)|^)(?:(?=\D)|$)/i


// console.log(pattern.test('Senior'));

// const arr = [1,2,3,4,5,6,7,8,9,10]

// console.log(arr.slice(arr.length/2))
const text = 'Bachelors’ degree preferably in industrial engineering and management, management Information Systems, Business Administration with specialization in Information Systems.At least one year of proven experience in the information systems fieldInterpersonal skills and the ability to work with various customers at a time.Strong communication skills mainly in English.Familiarity with XML, JavaScript, HTML, Crystal and SQL – an advantage';
const reg = /(?:תואר|ניהול|ראש|degree|ניסיון|bachelors)/gi

const obj = {name:'or', age:22}

for (const key in obj){
  console.log(key);
}
console.log(reg.test(text));