function getEnding(value, template) {
  //template example ['голос', "голоса", "голосов"]
  value = Math.abs(value)
  let lastTwoSyms = value % 100
  let lastSym = value % 10

  if (lastTwoSyms >= 10 && lastTwoSyms <= 20) {
    return `${value} ${template[2]}`
  } else if ((lastSym >= 5 && lastSym <= 9) || lastSym === 0) {
    return `${value} ${template[2]}`
  } else if (lastSym >= 2 && lastSym <= 4) {
    return `${value} ${template[1]}`
  }

  return `${value} ${template[0]}`
}

function getTopUsers(users, commits) {
  let usersCommits = []
  for (let i = 0; i < users.length + 1; i++) {
    usersCommits[i] = 0
  }

  commits.forEach(commit => {
    usersCommits[commit.author] += 1
  })

  let sortedUsersCommits = [...usersCommits].sort((a, b) => b - a)
  let topUsers = []

  for (let i = 0; topUsers.length < users.length; i++) {
    let user = users.find(
      user => user.id === usersCommits.indexOf(sortedUsersCommits[i])
    )

    topUsers.push({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      valueText: `${usersCommits[user.id]}`,
    })

    usersCommits[user.id] = null
  }

  return topUsers
}

function getTopCommentsUsers(users, comments) {
  let usersComments = []
  for (let i = 0; i < users.length + 1; i++) {
    usersComments[i] = 0
  }

  comments.forEach(
    comment => (usersComments[comment.author] += comment.likes.length)
  )

  let sortedUsersComments = [...usersComments].sort((a, b) => b - a)
  let topCommentsUsers = []

  for (let i = 0; topCommentsUsers.length < users.length; i++) {
    let user = users.find(
      user => user.id === usersComments.indexOf(sortedUsersComments[i])
    )

    topCommentsUsers.push({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      valueText: getEnding(usersComments[user.id], [
        'голос',
        'голоса',
        'голосов',
      ]),
    })

    usersComments[user.id] = null
  }

  return topCommentsUsers
}

function getSprintStatistic(sprintId, commits, sprints) {
  const sprint = sprints.find(creature => creature.id === sprintId)
  let counter = 0

  commits = commits.filter(
    commit =>
      commit.timestamp > sprint.startAt && commit.timestamp < sprint.finishAt
  )

  counter = commits.length

  return counter
}

function getChartStatistic(
  sprint,
  commits,
  sprints,
  sprintsBefore,
  sprintsAfter
) {
  let result = [
    {
      title: `${sprint.id}`,
      hint: sprint.name,
      value: getSprintStatistic(sprint.id, commits, sprints),
      active: true,
    },
  ]

  for (let i = 1; i <= sprintsBefore; i++) {
    let currentSprint = sprints.find(
      currSprint => currSprint.id === sprint.id - i
    )

    result.unshift({
      title: `${sprint.id - i}`,
      hint: currentSprint.name,
      value: getSprintStatistic(sprint.id - i, commits, sprints),
    })
  }

  for (let i = 1; i <= sprintsAfter; i++) {
    let currentSprint = sprints.find(
      currSprint => currSprint.id === sprint.id + i
    )

    result.push({
      title: `${sprint.id + i}`,
      hint: currentSprint.name,
      value: getSprintStatistic(sprint.id + i, commits, sprints),
    })
  }

  return result
}

function getCommitSizes(sprint, commits, allSummaries) {
  let smallCommits = 0
  let mediumCommits = 0
  let bigCommits = 0
  let hugeCommits = 0

  commits = commits.filter(
    commit =>
      commit.timestamp > sprint.startAt && commit.timestamp < sprint.finishAt
  )

  commits.forEach(commit => {
    let size = 0
    size += commit.summaries.reduce((accum, commitSummary) => {
      let currentSummary = allSummaries.find(
        summary => summary.id === commitSummary
      )

      if (currentSummary) {
        return accum + currentSummary.added + currentSummary.removed
      } else {
        return accum
      }
    }, 0)

    if (size > 0 && size <= 100) {
      smallCommits++
    } else if (size > 100 && size <= 500) {
      mediumCommits++
    } else if (size > 500 && size <= 1000) {
      bigCommits++
    } else if (size > 1000) {
      hugeCommits++
    }
  })

  return [smallCommits, mediumCommits, bigCommits, hugeCommits]
}

function getDiagramStatistic(sprint, previousSprint, commits, allSummaries) {
  const [currentSmall, currentMedium, currentBig, currentHuge] = getCommitSizes(
    sprint,
    commits,
    allSummaries
  )
  const [
    previousSmall,
    previousMedium,
    previousBig,
    previousHuge,
  ] = getCommitSizes(previousSprint, commits, allSummaries)
  const smallDifference = currentSmall - previousSmall
  const mediumDifference = currentMedium - previousMedium
  const bigDifference = currentBig - previousBig
  const hugeDifference = currentHuge - previousHuge

  return [
    {
      title: '> 1001 строки',
      valueText: `${currentHuge} коммитов`,
      differenceText: `${
        hugeDifference < 0 ? '-' : '+'
      }${getEnding(hugeDifference, ['коммит', 'коммита', 'коммитов'])}`,
    },
    {
      title: '501 — 1000 строк',
      valueText: `${currentBig} коммитов`,
      differenceText: `${
        bigDifference < 0 ? '-' : '+'
      }${getEnding(bigDifference, ['коммит', 'коммита', 'коммитов'])}`,
    },
    {
      title: '101 — 500 строк',
      valueText: `${currentMedium} коммитов`,
      differenceText: `${
        mediumDifference < 0 ? '-' : '+'
      }${getEnding(mediumDifference, ['коммит', 'коммита', 'коммитов'])}`,
    },
    {
      title: '1 — 100 строк',
      valueText: `${currentSmall} коммитов`,
      differenceText: `${
        smallDifference < 0 ? '-' : '+'
      }${getEnding(smallDifference, ['коммит', 'коммита', 'коммитов'])}`,
    },
  ]
}

function getActivityStatistic(commits) {
  const hoursInDay = 24
  const monArray = []

  for (let i = 0; i < hoursInDay; i++) {
    monArray[i] = 0
  }

  const tueArray = [...monArray]
  const wedArray = [...monArray]
  const thuArray = [...monArray]
  const friArray = [...monArray]
  const satArray = [...monArray]
  const sunArray = [...monArray]

  commits.forEach(commit => {
    let commitHour = new Date(commit.timestamp).getHours()

    switch (new Date(commit.timestamp).getDay()) {
      case 0:
        sunArray[commitHour]++
        break
      case 1:
        monArray[commitHour]++
        break
      case 2:
        tueArray[commitHour]++
        break
      case 3:
        wedArray[commitHour]++
        break
      case 4:
        thuArray[commitHour]++
        break
      case 5:
        friArray[commitHour]++
        break
      case 6:
        satArray[commitHour]++
        break
    }
  })

  return {
    mon: monArray,
    tue: tueArray,
    wed: wedArray,
    thu: thuArray,
    fri: friArray,
    sat: satArray,
    sun: sunArray,
  }
}

function prepareData(data, { sprintId } = obj) {
  const sprint = data.find(creature => creature.id === sprintId)
  const previousSprint = data.find(creature => creature.id === sprintId - 1)

  const sprints = data.filter(creature => creature.type === 'Sprint')
  const users = data.filter(creature => creature.type === 'User')
  const comments = data.filter(creature => creature.type === 'Comment')
  const commits = data.filter(creature => creature.type === 'Commit')
  const summaries = data.filter(creature => creature.type === 'Summary')

  const timedCommits = commits.filter(
    commit =>
      commit.timestamp > sprint.startAt && commit.timestamp < sprint.finishAt
  )
  const timedComments = comments.filter(
    comment =>
      comment.createdAt > sprint.startAt && comment.createdAt < sprint.finishAt
  )

  const topUsers = getTopUsers(users, timedCommits)
  const topCommentsUsers = getTopCommentsUsers(users, timedComments)
  const chartStatistic = getChartStatistic(sprint, commits, sprints, 19, 19)
  const diagramStatistic = getDiagramStatistic(
    sprint,
    previousSprint,
    commits,
    summaries
  )
  const activityStatistic = getActivityStatistic(timedCommits)

  const totalDiagramText = diagramStatistic.reduce(
    (value, item) => value + parseInt(item.valueText.split(' ')[0]),
    0
  )
  const differenceDiagramText = diagramStatistic.reduce(
    (value, item) => value + parseInt(item.differenceText.split(' ')[0]),
    0
  )

  return [
    {
      alias: 'leaders',
      data: {
        title: 'Больше всего коммитов',
        subtitle: sprint.name,
        emoji: '👑',
        users: topUsers,
      },
    },
    {
      alias: 'vote',
      data: {
        title: 'Самый 🔎 внимательный разработчик',
        subtitle: sprint.name,
        emoji: '🔎',
        users: topCommentsUsers,
      },
    },
    {
      alias: 'chart',
      data: {
        title: 'Коммиты',
        subtitle: sprint.name,
        values: chartStatistic,
        users: topUsers,
      },
    },
    {
      alias: 'diagram',
      data: {
        title: 'Размер коммитов',
        subtitle: sprint.name,
        totalText: getEnding(totalDiagramText, [
          'коммит',
          'коммита',
          'коммитов',
        ]),
        differenceText: `${
          differenceDiagramText < 0
            ? `${differenceDiagramText}`
            : `+${differenceDiagramText}`
        } с прошлого спринта`,
        categories: diagramStatistic,
      },
    },
    {
      alias: 'activity',
      data: {
        title: 'Коммиты',
        subtitle: sprint.name,
        data: activityStatistic,
      },
    },
  ]
}

export = { prepareData }
