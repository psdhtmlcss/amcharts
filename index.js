SERIES_COUNT = 3;
const SERIES_COLORS = ['#ff22ff', '#325677', '#954621'];
const mySeries = [];

am5.ready(function() {
  const root = am5.Root.new("chart");
  // console.log('root', root);

  // Set themes
  // https://www.amcharts.com/docs/v5/concepts/themes/
  root.setThemes([
    am5themes_Animated.new(root)
  ]);

  // Generate random data
  let value = 100;

  function generateChartData() {
    const chartData = [];
    const firstDate = new Date();
    firstDate.setDate(firstDate.getDate() - 1000);
    firstDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 50; i++) {
      let newDate = new Date(firstDate);
      newDate.setSeconds(newDate.getSeconds() + i);

      value += (Math.random() < 0.5 ? 1 : -1) * Math.random() * 10;

      chartData.push({
        date: newDate.getTime(),
        value: value
      });
    }
    return chartData;
  };

  // const data = generateChartData();
  // console.log('data', data);

  // Create chart
  // https://www.amcharts.com/docs/v5/charts/xy-chart/
  const chart = root.container.children.push(am5xy.XYChart.new(root, {
    focusable: true,
    panX: true,
    panY: true,
    wheelX: "panX",
    wheelY: "zoomX",
    pinchZoomX: true,
    layout: root.verticalLayout,
  }));

  const easing = am5.ease.linear;

  // Create axes
  // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
  const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
    maxDeviation: 0.5,
    groupData: false,
    extraMax: 0.1, // this adds some space in front
    extraMin: -0.1,  // this removes some space form th beginning so that the line would not be cut off
    baseInterval: {
      timeUnit: "second",
      count: 1
    },
    renderer: am5xy.AxisRendererX.new(root, {
      minGridDistance: 50
    }),
    tooltip: am5.Tooltip.new(root, {})
  }));

  const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
    renderer: am5xy.AxisRendererY.new(root, {})
  }));


  // Add series
  // https://www.amcharts.com/docs/v5/charts/xy-chart/series/

  const createSeries = (count) => {
    for (let i = 0; i < count; i++) {
      mySeries[i] = chart.series.push(am5xy.LineSeries.new(root, {
        name: `Series ${i + 1}`,
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        valueXField: "date",
        tooltip: am5.Tooltip.new(root, {
          pointerOrientation: "horizontal",
          labelText: "{valueY}"
        })
      }));

      const data = generateChartData();
      data[data.length - 1].bullet = true;
      mySeries[i].data.setAll(data);

      mySeries[i].set('fill', am5.color(`${SERIES_COLORS[i]}`));
      mySeries[i].set('stroke', am5.color(`${SERIES_COLORS[i]}`));

      // Create animating bullet by adding two circles in a bullet container and
      // animating radius and opacity of one of them.
      mySeries[i].bullets.push(function (root, series, dataItem) {
        // only create sprite if bullet == true in data context
        // console.log(dataItem.dataContext.bullet)
        if (dataItem.dataContext.bullet) {
          const container = am5.Container.new(root, {});
          const circle0 = container.children.push(am5.Circle.new(root, {
            radius: 5,
            fill: am5.color(`${SERIES_COLORS[i]}`)
          }));
          const circle1 = container.children.push(am5.Circle.new(root, {
            radius: 5,
            fill: am5.color(`${SERIES_COLORS[i]}`)
          }));

          circle1.animate({
            key: "radius",
            to: 20,
            duration: 1000,
            easing: am5.ease.out(am5.ease.cubic),
            loops: Infinity
          });
          circle1.animate({
            key: "opacity",
            to: 0,
            from: 1,
            duration: 1000,
            easing: am5.ease.out(am5.ease.cubic),
            loops: Infinity
          });

          return am5.Bullet.new(root, {
            locationX: undefined,
            sprite: container
          })
        }
      })
    }

    console.log('my series', mySeries);

  };

  createSeries(SERIES_COUNT);

  // Add cursor
  // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
  const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
    xAxis: xAxis
  }));
  cursor.lineY.set("visible", false);

  const legend = chart.children.unshift(am5.Legend.new(root, {
    marginBottom: 50,
  }));
  legend.data.setAll(chart.series.values);

  // Update data every second
  setInterval(function () {
    addData();
  }, 1000)

  function addData() {
    for (let i = 0; i < SERIES_COUNT; i++) {
      let lastDataItem = mySeries[i].dataItems[mySeries[i].dataItems.length - 1];

      const lastValue = lastDataItem.get("valueY");
      const newValue = value + ((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
      const lastDate = new Date(lastDataItem.get("valueX"));
      const time = am5.time.add(new Date(lastDate), "second", 1).getTime();
      // series1.data.removeIndex(0);
      mySeries[i].data.push({
        date: time,
        value: newValue
      })

      let newDataItem = mySeries[i].dataItems[mySeries[i].dataItems.length - 1];
      newDataItem.animate({
        key: "valueYWorking",
        to: newValue,
        from: lastValue,
        duration: 600,
        easing: easing
      });

      // use the bullet of last data item so that a new sprite is not created
      newDataItem.bullets = [];
      newDataItem.bullets[0] = lastDataItem.bullets[0];
      newDataItem.bullets[0].get("sprite").dataItem = newDataItem;
      // reset bullets
      lastDataItem.dataContext.bullet = false;
      lastDataItem.bullets = [];


      const animation = newDataItem.animate({
        key: "locationX",
        to: 0.5,
        from: -0.5,
        duration: 600
      });
      if (animation) {
        const tooltip = xAxis.get("tooltip");
        if (tooltip && !tooltip.isHidden()) {
          animation.events.on("stopped", function () {
            xAxis.updateTooltip();
          })
        }
      }
    }
  };

  // Make stuff animate on load
  // https://www.amcharts.com/docs/v5/concepts/animations/
  chart.appear(1000, 100);


});