document.addEventListener('DOMContentLoaded', () => {
    let projectData = JSON.parse(localStorage.getItem('projectData')) || [];
    const addProjectForm = document.getElementById('addProjectForm');
    const tableBody = document.getElementById('trackerBody');
    const chartContainer = document.getElementById('chartContainer');
    let charts = {};
  
    function saveData() {
        localStorage.setItem('projectData', JSON.stringify(projectData));
    }
  
    function updateProgressTable() {
        tableBody.innerHTML = '';
        projectData.forEach((entry, index) => {
            const totalTasks = entry.tasks.length;
            const completedTasks = entry.tasks.filter(task => task.completed).length;
            const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const status = progressPercent === 100 ? "Completed" : "In Progress";
            const endDate = new Date(entry.startDate);
            endDate.setDate(endDate.getDate() + 28);
  
            const taskListHtml = entry.tasks.map((task, taskIndex) => `
                <div>
                    <input type="checkbox" class="taskCheckbox" data-project-index="${index}" data-task-index="${taskIndex}" ${task.completed ? 'checked' : ''}>
                    ${task.name}
                </div>
            `).join('');
  
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.name}</td>
                <td>Sprint ${entry.sprint}</td>
                <td>${entry.startDate}</td>
                <td>${endDate.toISOString().split('T')[0]}</td>
                <td>${taskListHtml}</td>
                <td>${progressPercent}%</td>
                <td>${status}</td>
                <td><button class="removeButton" data-index="${index}">Remove</button></td>
            `;
            tableBody.appendChild(row);
        });
        addEventListeners();
    }
  
    addProjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskNames = document.getElementById('taskList').value.split(',').map(task => task.trim());
        const tasks = taskNames.map(taskName => ({ name: taskName, completed: false, completedDate: null }));
  
        const newEntry = {
            name: document.getElementById('projectName').value,
            sprint: parseInt(document.getElementById('sprint').value),
            startDate: document.getElementById('startDate').value,
            tasks: tasks
        };
  
        projectData.push(newEntry);
        saveData();
        updateProgressTable();
        updateAllCharts();
        addProjectForm.reset();
    });
  
    function addEventListeners() {
        document.querySelectorAll('.taskCheckbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const projectIndex = e.target.getAttribute('data-project-index');
                const taskIndex = e.target.getAttribute('data-task-index');
                const today = new Date().toISOString().split('T')[0];
  
                projectData[projectIndex].tasks[taskIndex].completed = e.target.checked;
                projectData[projectIndex].tasks[taskIndex].completedDate = e.target.checked ? today : null;
                saveData();
                updateProgressTable();
                updateAllCharts();
            });
        });
  
        document.querySelectorAll('.removeButton').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                projectData.splice(index, 1);
                saveData();
                updateProgressTable();
                updateAllCharts();
            });
        });
    }
  
    function createProjectChart(projectName, projectEntries) {
        const canvas = document.createElement('canvas');
        canvas.classList.add('projectChart');
        chartContainer.appendChild(canvas);
  
        const dailyProgressData = {};
        let totalTasks = 0;
  
        projectEntries.forEach(entry => {
            totalTasks += entry.tasks.length;
  
            entry.tasks.forEach(task => {
                if (task.completedDate) {
                    dailyProgressData[task.completedDate] = (dailyProgressData[task.completedDate] || 0) + 1;
                }
            });
        });
  
        const sortedDates = Object.keys(dailyProgressData).sort();
        const cumulativeData = [];
        let cumulativeCount = 0;
  
        sortedDates.forEach(date => {
            cumulativeCount += dailyProgressData[date];
            const percentCompleted = (cumulativeCount / totalTasks) * 100;
            cumulativeData.push(percentCompleted);
        });
  
        const chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: `Cumulative Progress (%) - ${projectName}`,
                    data: cumulativeData,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true,
                }]
            },
            options: {
                scales: {
                    x: {
                        title: { display: true, text: 'Date' },
                        ticks: { autoSkip: true, maxRotation: 45 } // Avoid overlapping x-axis labels
                    },
                    y: {
                        title: { display: true, text: 'Percentage Completed (%)' },
                        beginAtZero: true,
                        min: 0,  // Ensures that the y-axis starts at 0
                        max: 100, // Ensures that the y-axis goes up to 100
                        stepSize: 10 // Makes the ticks more readable
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
            }
        });
  
        charts[projectName] = chart;
    }
  
    function updateAllCharts() {
        chartContainer.innerHTML = '';
        const projectsGrouped = projectData.reduce((acc, entry) => {
            acc[entry.name] = acc[entry.name] || [];
            acc[entry.name].push(entry);
            return acc;
        }, {});
  
        for (const [projectName, projectEntries] of Object.entries(projectsGrouped)) {
            createProjectChart(projectName, projectEntries);
        }
    }
  
    updateProgressTable();
    updateAllCharts();
});
