// src/App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import cheerio from 'cheerio';

const App = () => {
  const [loginMessage, setLoginMessage] = useState('');

  const [problems, setProblems] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const getProblems = (response) => {
    try {
      const $ = cheerio.load(response.data);

      const allProblems = []
      $('table > thead > tr > th > a').each((index, element) => {
        const curProblem = {
          'problem_text': $(element).text(),
          'problem_num': parseInt(element.attribs.href.split('/')[2]),
          'problem_url': 'https://acmicpc.net' + element.attribs.href,
        };
        allProblems.push(curProblem);
      });

      setProblems(allProblems);
    }
    catch (e) {
      console.error(e);
    }
  };

  const getUserInfo = (response) => {
    try {
      const $ = cheerio.load(response.data);

      const allUsers = []
      $('table > tbody > tr').each((index, tr) => {
        const curUser = {
          'ranking': 0,
          'username': "",
          'user_url': "",
          'problems': [],
        };
        $(tr).find('th').each((index, th) => {
          if(index === 0) { // ranking
            curUser.ranking = parseInt($(th).text());
          }
          else if(index === 1) { // user info
            curUser.username = $(th).text();
            curUser.user_url = 'https://acmicpc.net' + $(th).find('a')[0].attribs.href;
          }
        });
        $(tr).find('td').each((index, td) => {
          const curProblem = {
            'problem_id': index,
            'score': $(td).text(),
            'status': $(td).attr('class') ? $(td).attr('class') : 'notsubmitted',
          };
          curUser.problems.push(curProblem);
        });
        allUsers.push(curUser);
      });

      setUsers(allUsers);
    }
    catch (e) {
      console.error(e);
    }
  }

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5005/data');

      getProblems(response);
      getUserInfo(response);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    console.log('problems changed');
    console.log(problems);
  }, [problems]);

  useEffect(() => {
    console.log('users changed');
    console.log(users);
  }, [users]);

  const handleLogin = async () => {
    try {
      const response = await axios.get('http://localhost:5005/login');
      setLoginMessage(response.data);
      fetchData(); // 로그인 후 데이터 가져오기
    } catch (error) {
      console.error('Login error:', error);
      setLoginMessage('Login failed.');
    }
  };

  useEffect(() => {
    fetchData(); // 컴포넌트 마운트 시 데이터 가져오기
  }, []);

  return (
    <div className="App">
      <button onClick={handleLogin}>Login</button>
      {loginMessage && <p>{loginMessage}</p>}
      {/* {data} */}
      {!loading
      ? 
        <div>
          <table>
            <thead>
              <tr>
                <th>랭킹</th>
                <th>아이디</th>
                {problems.map((problem, problemid) => (
                  <th key = {problemid}>
                    <a href = {problem.problem_url}>
                      {problem.problem_text}
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, userid) => (
                <tr key = {userid}>
                  <th>{user.ranking}</th>
                  <th>
                    <a href = {user.user_url}>
                      {user.username}
                    </a>
                  </th>
                  {user.problems.map((user_problem, userproblemid) => (
                  <th key = {userproblemid} style = {{ 
                    backgroundColor: user_problem.status === "accepted" ? "#b0f4b0" : user_problem.status === "wronganswer" ? "#f4b0b0" : "white"
                  }}>
                    {user_problem.score}
                  </th>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      : 
        <p>Loading...</p>
      }
    </div>
  );
}

export default App;
