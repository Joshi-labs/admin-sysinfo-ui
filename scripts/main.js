
async function fetchData() {
  try {
    const response = await fetch("https://api-sysinfo.vpjoshi.in/main");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    makeChanges(data);
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }
}

async function fetchStaticData() {
  try {
    const response = await fetch("https://api-sysinfo.vpjoshi.in/static");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    makeStaticChanges(data);
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }
}

function makeChanges(data) {
  console.log("Fetched data:", data);
  updateCPUUtil(data);
  updateMemoryUtil(data);
  updateUptime(data);
  updateCPUTDP(data);
  updateCpuTemp(data);
  updateContainerTable(data);
  updateMemoryUsageChart(data);
  updateContainerHealth(data.container_info);
}

function makeStaticChanges(data) {
  console.log("Fetched data:", data);
  updateHDDInfo(data);
  updateSSDInfo(data);
  updateElectricityUsed(data);
  updateElectricityEstimates(data);
}

function updateHDDInfo(data) {
  const hddElement = document.getElementById('_HDD_INFO');
  if (!hddElement) return;

  if (data && data.hdd_util) {
    const { used_gb, used_percent } = data.hdd_util;
    hddElement.innerHTML = `${used_gb.toFixed(1)}GB <small>~${used_percent}%</small>`;
  } else {
    hddElement.innerHTML = `N/A <small>~0%</small>`;
  }
}

function updateSSDInfo(data) {
  const hddElement = document.getElementById('_SSD_INFO');
  if (!hddElement) return;

  if (data && data.ssd_util) {
    const { used_gb, used_percent } = data.ssd_util;
    hddElement.innerHTML = `${used_gb.toFixed(1)}GB <small>~${used_percent}%</small>`;
  } else {
    hddElement.innerHTML = `N/A <small>~0%</small>`;
  }
}

function updateCPUUtil(data) {
  const el = document.getElementById('_CPU_UTIL');
  if (el && data.cpu_util_percent !== undefined) {
    el.innerHTML = `${data.cpu_util_percent.toFixed(1)}<sup style="font-size: 20px">%</sup>`;
  }
}

function updateMemoryUtil(data) {
  const el = document.getElementById('_MEMORY_UTIL');
  if (el && data.memory_util_percent !== undefined) {
    el.innerHTML = `${data.memory_util_percent.toFixed(1)}<sup style="font-size: 20px">%</sup>`;
  }
}

function updateUptime(data) {
  const el = document.getElementById('_UPTIME_INFO');
  if (!el || !data.uptime_hours || !data.uptime_minutes) return;

  const hourMatch = data.uptime_hours.match(/(\d+)H\s+(\d+)M/);
  const minuteMatch = data.uptime_minutes.match(/(\d+)M\s+(\d+)S/);

  if (hourMatch && parseInt(hourMatch[1]) !== 0) {
    const hours = hourMatch[1];
    const minutes = hourMatch[2];
    el.innerHTML = `${hours}<sup style="font-size: 20px">H</sup> ${minutes}<sup style="font-size: 20px">M</sup>`;
  } else if (minuteMatch) {
    const minutes = minuteMatch[1];
    const seconds = minuteMatch[2];
    el.innerHTML = `${minutes}<sup style="font-size: 20px">M</sup> ${seconds}<sup style="font-size: 20px">S</sup>`;
  }
}

function updateCPUTDP(data) {
  const el = document.getElementById('_CPU_TDP_INFO');
  if (el && data.power_watts !== undefined) {
    el.innerHTML = `${data.power_watts.toFixed(2)}W`;
  }
}

function updateCpuTemp(data) {
  const el = document.getElementById('_CPU_TEMP_INFO');
  if (!el || typeof data.cpu_temp_celsius !== 'number') return;

  el.innerHTML = `${data.cpu_temp_celsius}<sup style="font-size: 20px">°C</sup>`;
}

function updateContainerTable(data) {
  const tableBody = document.querySelector('.table tbody');
  if (!tableBody || !Array.isArray(data.container_info)) return;

  tableBody.innerHTML = ''; // Clear existing rows

  data.container_info.forEach(pod => {
    const row = document.createElement('tr');

    // Pod Name
    const idCell = document.createElement('td');
    idCell.innerHTML = `<a href="#">${pod.name}</a>`;
    row.appendChild(idCell);

    // Project (Namespace)
    const projectCell = document.createElement('td');
    projectCell.textContent = pod.namespace || '-';
    row.appendChild(projectCell);

    // Status
    const statusCell = document.createElement('td');
    const status = pod.status.toLowerCase();
    let badgeClass = 'badge-secondary';
    if (status === 'running') badgeClass = 'badge-success';
    else if (status === 'succeeded') badgeClass = 'badge-info';
    else if (status === 'pending') badgeClass = 'badge-warning';
    else if (status === 'failed') badgeClass = 'badge-danger';

    statusCell.innerHTML = `<span class="badge ${badgeClass}">${pod.status}</span>`;
    row.appendChild(statusCell);

    // IP Address
    const ipCell = document.createElement('td');
    ipCell.textContent = pod.ip || '-';
    row.appendChild(ipCell);

    // Container Images (joined)
    const containers = pod.containers.map(c => `${c.name} (${c.image})`);
    const imageCell = document.createElement('td');
    imageCell.textContent = containers.join(', ') || '-';
    row.appendChild(imageCell);

    tableBody.appendChild(row);
  });
}


function updateMemoryUsageChart(data) {
  const processData = data.top_memory_processes;

  // Extract names and memory usages of top 6 processes
  const labels = [];
  const values = [];
  const colors = ['#f56954', '#00a65a', '#f39c12', '#00c0ef', '#3c8dbc', '#605ca8'];

  for (let i = 1; i <= 6; i++) {
    const proc = processData[`top_${i}`];
    labels.push(proc.name);
    values.push(proc.memory_usage);
  }

  // Add 'Others'
  labels.push('System');
  values.push(processData.others_sum);
  colors.push('#d2d6de'); // Light grey for others

  // Update the chart
  pieChart.data.labels = labels;
  pieChart.data.datasets[0].data = values;
  pieChart.data.datasets[0].backgroundColor = colors;
  pieChart.update();

  // Optional: Update chart legend if needed
  const legendContainer = document.querySelector('.chart-legend.clearfix');
  if (legendContainer) {
    legendContainer.innerHTML = labels.map((label, i) => `
      <li><i class="far fa-circle" style="color:${colors[i]}"></i> ${label}</li>
    `).join('');
  }

  // Optional: Update footer values if needed
  const footer = document.querySelector('.card-footer ul');
  if (footer) {
    footer.innerHTML = labels.map((label, i) => `
      <li class="nav-item">
        <a class="nav-link">
          ${label}
          <span class="float-right">${values[i].toFixed(1)}MiB</span>
        </a>
      </li>
    `).join('');
  }
}

function updateContainerHealth(containerInfo) {
  const containerCount = containerInfo.length;
  let healthyCount = 0;

  // Check health from status (you can improve this by checking more detailed health if available)
  containerInfo.forEach(container => {
    if (container.status && (container.status.toLowerCase() === 'running' || container.status.toLowerCase() === 'succeeded')) {
      healthyCount++;
    }
  });

  const percentHealthy = ((healthyCount / containerCount) * 100).toFixed(0);

  // Update HTML
  const containerDiv = document.getElementById('_CONTAINER_HEALTH');
  if (containerDiv) {
    containerDiv.innerHTML = `
      <h3>${percentHealthy}<sup style="font-size: 20px">%</sup></h3>
      <p>${healthyCount}/${containerCount} Containers are healthy</p>
    `;
  }
}

function updateElectricityUsed(data){
  const el = document.getElementById('_ELECTRICITY_USED_TILL_NOW');
  if (!el || !data.electricity_used_till_now) return;

  el.innerHTML = `${data.electricity_used_till_now}<small>kWh</small>`;
}

function updateElectricityEstimates(data){
  const el = document.getElementById('_ELECTRICITY_ESTIMATES');
  console.log(data.total_energy_per_month , data.total_estimated_cost_per_month);

  if (!el || !data.total_energy_per_month || !data.total_estimated_cost_per_month ) return;

  el.innerHTML = `${data.total_estimated_cost_per_month}Rs<small> ~ ${data.total_energy_per_month}kWh</small>`;
}


async function checkServerStatus() {
      try {
        const res = await fetch('https://api-sysinfo.vpjoshi.in/status');
        const data = await res.json();

        if (data.status !== 'good') {
          const modal = new bootstrap.Modal(document.getElementById('serverModal'));
          modal.show();
        }
        else{
          setInterval(fetchData, 1000);
          fetchStaticData();
        }
      } catch (err) {
        // Show modal even if fetch fails (network/server error)
        const modal = new bootstrap.Modal(document.getElementById('serverModal'));
        modal.show();

      }
    }

    // Call when DOM is ready
    document.addEventListener('DOMContentLoaded', checkServerStatus);



