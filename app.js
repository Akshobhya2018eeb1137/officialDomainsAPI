const express = require('express');
const request = require('request');
const cheerio = require('cheerio');
const cors = require('cors');

const port = process.env.port || 5000;
const app = express();

// app.use(express.json()); // this is necessary

app.use(cors({origin: "*"}));

app.get('/search/:query', (req, res) => {
    // query = "state bank of india";
    query = req.params.query;
    const url = `https://igod.gov.in/search?keyword=${query}`; // construct URL with query

    request(url, (error, response, html) => {
    if (!error && response.statusCode == 200){
        // res.send(html); 
        const $ = cheerio.load(html);

        let htmlOfDivSearchContent = $('.search-content').children().toString();
        htmlOfDivSearchContent = htmlOfDivSearchContent.replace(/(\r\n|\n|\r)/gm, "");      //replaces all new line(\n) charcters in this string with ""

        const {numOfOccurence, indicesArray} = getIndices(htmlOfDivSearchContent);      //get idices of <a href= in above string and num of its occurence
        
        const linksArray = [];      //array to store links of websites
        const namesArray = [];      //array to store names of websites
        
        for(let k = 0; k < numOfOccurence; k++){
            let start = indicesArray[k] + 9;        //this points to the index where websites link starts, i.e. after <a href="
            let end = start;        //this will contain the index where the website's link ends, so the website will be found b/w start and end
            while(htmlOfDivSearchContent[end] != '"'){
                end++;
            }

            linksArray.push(htmlOfDivSearchContent.substring(start, end));

            start = end;        //so as to not again go through same characters, we are going to be iterating after end now
            while(htmlOfDivSearchContent[start] != '>')start++;     //now start is at the closing of href i.e, at > this character
            let nameStart = start + 1;      //contains the starting index of the website's name 
            let nameEnd = start + 1;        //will contain the ending index of the website's name
            while(htmlOfDivSearchContent[nameEnd] != '<')nameEnd++;
            
            let outputString = htmlOfDivSearchContent.substring(nameStart, nameEnd);
            outputString = clearifyString(outputString);        //removes all the unnecessary \n characters and spaces from the string
            namesArray.push(outputString);
        }

        const outputObj = [];
        for(let i = 0; i < numOfOccurence; i++){
            let arg = new Object();
            arg.name = namesArray[i];
            arg.link = linksArray[i];
            outputObj.push(arg);
        }
        
        res.json(JSON.parse(JSON.stringify(outputObj)));
        
    }else {
        res.status(500).json({error: "error.message"}); // handle error
    }
    });
});
app.listen(port, ()=>{});




function getIndices(htmlOfDivSearchContent){
    let pos = 0;
    let numOfOccurence = -1;
    let i = -1;
    let indicesArray = [];
    while (pos != -1) {
        pos = htmlOfDivSearchContent.indexOf('<a href="', i + 1);
        indicesArray.push(pos);
        numOfOccurence += 1;
        i = pos;
    }
    return {
        numOfOccurence, indicesArray,
    }
}

function clearifyString(outputString){
    let i = 0;
    let j = outputString.length - 1;
    while(outputString[i] == ' ')i++;
    while(outputString[j] == ' ')j--;
    return outputString.substring(i, j + 1);
}