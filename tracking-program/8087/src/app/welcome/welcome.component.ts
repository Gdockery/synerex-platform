import {Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {CurrentUserService} from "../shared/user/currentUser.service";
import { HttpClient } from '@angular/common/http';
import {WhitelabelService} from "../shared/services/whitelabel.service";

//const fs = require('fs');

@Component({
  templateUrl: './welcome.component.html'
})
export class WelcomeComponent implements AfterViewInit {
	private realTimeData;
  public firstLoad = true;
	public projectData = [];
  public hasProjects = false;
  public projects = [];
  public projectSelected = 0;
	public selectedProjectName = 'ALL SITES';
  public welcomeImageUrl: string;
  public brandName: string = 'Synerex'; // Default, will be updated

  get displayName(): string {
    const user = this.userService.user;
    if (!user) return '';
    return user.firstName ? String(user.firstName) : '';
  }

  constructor(private userService: CurrentUserService, private http: HttpClient, private whitelabelService: WhitelabelService) {
    this.welcomeImageUrl = '';
    // Load brand name
    this.whitelabelService.getBrandName().subscribe(brandName => {
      this.brandName = brandName;
    });
    // if(!window.location.hash) {
    //     window.location.hash = 'loaded';
    //     window.location.reload();
    // }
  }

  ngAfterViewInit() {
    // Remove legacy welcome image from DOM once rendered.
    const welcomeImage = document.querySelector('img[src="/tracking-images/synerex-welcome2.png"]');
    if (welcomeImage && welcomeImage.parentNode) {
      welcomeImage.parentNode.removeChild(welcomeImage);
    }
  }

  ngOnInit() {
		this.userService.deselectProject();

    this.userService.user.projects.forEach(project => { 
      if (project.selectedTest) {
        this.projects.push({id: project.id, name: project.name});
      }
		});
		
		this.hasProjects = this.projects.length > 0
    
		this.renderData();
  }

  ngOnDestroy() {
		if(this.renderDataTimeout) {
			clearTimeout(this.renderDataTimeout)
			this.renderDataTimeout = null
		}
		if(this.loadDataTimeout) {
			clearTimeout(this.loadDataTimeout)
			this.loadDataTimeout = null
		}
  }

  jsTicker() {

    function SegmentDisplay(displayId) {
      this.displayId       = displayId;
      this.pattern         = '######.#';
      this.value           = '1';
      this.digitHeight     = 20;
      this.digitWidth      = 10;
      this.digitDistance   = 2.5;
      this.displayAngle    = 12;
      this.segmentWidth    = 2.5;
      this.segmentDistance = 0.2;
      this.segmentCount    = 7;
      this.cornerType      = 2;
      this.colorOn         = 'rgb(233, 93, 15)';
      this.colorOff        = 'rgb(75, 30, 5)';
    };

    SegmentDisplay.prototype.setValue = function(value) {
      this.value = value;
      this.draw();
    };

    SegmentDisplay.prototype.draw = function() {
      var display = <HTMLCanvasElement>document.getElementById(this.displayId);
      if (display) {
        var context = display.getContext('2d');
        if (context) {
          // clear canvas
          context.clearRect(0, 0, display.width, display.height);
          
          // compute and check display width
          var width = 0;
          var first = true;
          if (this.pattern) {
            for (var i = 0; i < this.pattern.length; i++) {
              var c = this.pattern.charAt(i).toLowerCase();
              if (c == '#') {
                width += this.digitWidth;
              } else if (c == '.' || c == ':') {
                width += this.segmentWidth;
              } else if (c != ' ') {
                return;
              }
              width += first ? 0 : this.digitDistance;
              first = false;
            }
          }
          if (width <= 0) {
            return;
          }
          
          // compute skew factor
          var angle = -1.0 * Math.max(-45.0, Math.min(45.0, this.displayAngle));
          var skew  = Math.tan((angle * Math.PI) / 180.0);
          
          // compute scale factor
          var scale = Math.min(display.width / (width + Math.abs(skew * this.digitHeight)), display.height / this.digitHeight);
          
          // compute display offset
          var offsetX = (display.width - (width + skew * this.digitHeight) * scale) / 2.0;
          var offsetY = (display.height - this.digitHeight * scale) / 2.0;
          
          // context transformation
          context.save();
          context.translate(offsetX, offsetY);
          context.scale(scale, scale);
          context.transform(1, 0, skew, 1, 0, 0);

          // draw segments
          var xPos = 0;
          var size = (this.value) ? this.value.length : 0;
          for (var i = 0; i < this.pattern.length; i++) {
            var mask  = this.pattern.charAt(i);
            var value = (i < size) ? this.value.charAt(i).toLowerCase() : ' ';
            xPos += this.drawDigit(context, xPos, mask, value);
          }

          // finish drawing
          context.restore();
        }
      }
    };

    SegmentDisplay.prototype.drawDigit = function(context, xPos, mask, c) {
      switch (mask) {
        case '#':
          var r = Math.sqrt(this.segmentWidth * this.segmentWidth / 2.0);
          var d = Math.sqrt(this.segmentDistance * this.segmentDistance / 2.0);
          var e = d / 2.0; 
          var f = (this.segmentWidth - d) * Math.sin((45.0 * Math.PI) / 180.0);
          var g = f / 2.0;
          var h = (this.digitHeight - 3.0 * this.segmentWidth) / 2.0;
          var w = (this.digitWidth - 3.0 * this.segmentWidth) / 2.0;
          var s = this.segmentWidth / 2.0;
          var t = this.digitWidth / 2.0;

          // draw segment a (a1 and a2 for 16 segments)
          if (this.segmentCount == 16) {
            var x = xPos;
            var y = 0;
            context.fillStyle = this.getSegmentColor(c, null, '02356789abcdefgiopqrstz@%');
            context.beginPath();
            context.moveTo(x + this.segmentWidth - f, y + this.segmentWidth - f - d);
            context.quadraticCurveTo(x + this.segmentWidth - g, y, x + this.segmentWidth, y);
        
            context.lineTo(x + t - d - s, y);
            context.lineTo(x + t - d, y + s);
            context.lineTo(x + t - d - s, y + this.segmentWidth);
            context.lineTo(x + this.segmentWidth + d, y + this.segmentWidth);
            context.fill();
            
            var x = xPos;
            var y = 0;
            context.fillStyle = this.getSegmentColor(c, null, '02356789abcdefgiopqrstz@');
            context.beginPath();
            context.moveTo(x + this.digitWidth - this.segmentWidth - d, y + this.segmentWidth);
            context.lineTo(x + t + d + s, y + this.segmentWidth);
            context.lineTo(x + t + d, y + s);
            context.lineTo(x + t + d + s, y);
            context.lineTo(x + this.digitWidth - this.segmentWidth, y);
            context.quadraticCurveTo(x + this.digitWidth - this.segmentWidth + g, y, x + this.digitWidth - this.segmentWidth + f, y + this.segmentWidth - f - d);
            context.fill();
            
          } else {
            var x = xPos;
            var y = 0;
            context.fillStyle = this.getSegmentColor(c, '02356789acefp', '02356789abcdefgiopqrstz@');
            context.beginPath();
            context.moveTo(x + this.segmentWidth - f, y + this.segmentWidth - f - d);
            context.quadraticCurveTo(x + this.segmentWidth - g, y, x + this.segmentWidth, y);
            context.lineTo(x + this.digitWidth - this.segmentWidth, y);
            context.quadraticCurveTo(x + this.digitWidth - this.segmentWidth + g, y, x + this.digitWidth - this.segmentWidth + f, y + this.segmentWidth - f - d);
            context.lineTo(x + this.digitWidth - this.segmentWidth - d, y + this.segmentWidth);
            context.lineTo(x + this.segmentWidth + d, y + this.segmentWidth);
            context.fill();
          }
          
          // draw segment b
          x = xPos + this.digitWidth - this.segmentWidth;
          y = 0;
          context.fillStyle = this.getSegmentColor(c, '01234789adhpy', '01234789abdhjmnopqruwy');
          context.beginPath();
          context.moveTo(x + f + d, y + this.segmentWidth - f);
          context.quadraticCurveTo(x + this.segmentWidth, y + this.segmentWidth - g, x + this.segmentWidth, y + this.segmentWidth);

          context.lineTo(x + this.segmentWidth, y + h + this.segmentWidth - d);
          context.lineTo(x + s, y + h + this.segmentWidth + s - d);
          context.lineTo(x, y + h + this.segmentWidth - d);
          context.lineTo(x, y + this.segmentWidth + d);
          context.fill();
          
          // draw segment c
          x = xPos + this.digitWidth - this.segmentWidth;
          y = h + this.segmentWidth;
          context.fillStyle = this.getSegmentColor(c, '013456789abdhnouy', '01346789abdghjmnoqsuw@', '%');
          context.beginPath();
          context.moveTo(x, y + this.segmentWidth + d);
          context.lineTo(x + s, y + s + d);
          context.lineTo(x + this.segmentWidth, y + this.segmentWidth + d);
          context.lineTo(x + this.segmentWidth, y + h + this.segmentWidth - d);

          context.quadraticCurveTo(x + this.segmentWidth, y + h + this.segmentWidth + g, x + f + d, y + h + this.segmentWidth + f); //
          context.lineTo(x, y + h + this.segmentWidth - d);
      
          context.fill();
          
          // draw segment d (d1 and d2 for 16 segments)
          if (this.segmentCount == 16) {
            x = xPos;
            y = this.digitHeight - this.segmentWidth;
            context.fillStyle = this.getSegmentColor(c, null, '0235689bcdegijloqsuz_=@');
            context.beginPath();
            context.moveTo(x + this.segmentWidth + d, y);
            context.lineTo(x + t - d - s, y);
            context.lineTo(x + t - d, y + s);
            context.lineTo(x + t - d - s, y + this.segmentWidth);
            context.lineTo(x + this.segmentWidth, y + this.segmentWidth);
            context.quadraticCurveTo(x + this.segmentWidth - g, y + this.segmentWidth, x + this.segmentWidth - f, y + f + d);
            context.lineTo(x + this.segmentWidth - f, y + f + d);
        
            context.fill();

            x = xPos;
            y = this.digitHeight - this.segmentWidth;
            context.fillStyle = this.getSegmentColor(c, null, '0235689bcdegijloqsuz_=@', '%');
            context.beginPath();
            context.moveTo(x + t + d + s, y + this.segmentWidth);
            context.lineTo(x + t + d, y + s);
            context.lineTo(x + t + d + s, y);
            context.lineTo(x + this.digitWidth - this.segmentWidth - d, y);
            context.lineTo(x + this.digitWidth - this.segmentWidth + f, y + f + d);
            context.quadraticCurveTo(x + this.digitWidth - this.segmentWidth + g, y + this.segmentWidth, x + this.digitWidth - this.segmentWidth, y + this.segmentWidth);
      
            context.fill();
          }
          else {
            x = xPos;
            y = this.digitHeight - this.segmentWidth;
            context.fillStyle = this.getSegmentColor(c, '0235689bcdelotuy_', '0235689bcdegijloqsuz_=@');
            context.beginPath();
            context.moveTo(x + this.segmentWidth + d, y);
            context.lineTo(x + this.digitWidth - this.segmentWidth - d, y);
            context.lineTo(x + this.digitWidth - this.segmentWidth + f, y + f + d);
            context.quadraticCurveTo(x + this.digitWidth - this.segmentWidth + g, y + this.segmentWidth, x + this.digitWidth - this.segmentWidth, y + this.segmentWidth);
            context.lineTo(x + this.segmentWidth, y + this.segmentWidth);
            context.quadraticCurveTo(x + this.segmentWidth - g, y + this.segmentWidth, x + this.segmentWidth - f, y + f + d);
            context.lineTo(x + this.segmentWidth - f, y + f + d);

            context.fill();
          }
          
          // draw segment e
          x = xPos;
          y = h + this.segmentWidth;
          context.fillStyle = this.getSegmentColor(c, '0268abcdefhlnoprtu', '0268acefghjklmnopqruvw@');
          context.beginPath();
          context.moveTo(x, y + this.segmentWidth + d);
          context.lineTo(x + s, y + s + d);
          context.lineTo(x + this.segmentWidth, y + this.segmentWidth + d);
          context.lineTo(x + this.segmentWidth, y + h + this.segmentWidth - d);

              context.lineTo(x + this.segmentWidth - f - d, y + h + this.segmentWidth + f); 
              context.quadraticCurveTo(x, y + h + this.segmentWidth + g, x, y + h + this.segmentWidth);

          context.fill();
          
          // draw segment f
          x = xPos;
          y = 0;
          context.fillStyle = this.getSegmentColor(c, '045689abcefhlpty', '045689acefghklmnopqrsuvwy@', '%');
          context.beginPath();
          context.moveTo(x + this.segmentWidth, y + this.segmentWidth + d);
          context.lineTo(x + this.segmentWidth, y + h + this.segmentWidth - d);
          context.lineTo(x + s, y + h + this.segmentWidth + s - d);
          context.lineTo(x, y + h + this.segmentWidth - d);
              context.lineTo(x, y + this.segmentWidth);
              context.quadraticCurveTo(x, y + this.segmentWidth - g, x + this.segmentWidth - f - d, y + this.segmentWidth - f); 
              context.lineTo(x + this.segmentWidth - f - d, y + this.segmentWidth - f); 
          
          context.fill();

          // draw segment g for 7 segments
          if (this.segmentCount == 7) {
            x = xPos;
            y = (this.digitHeight - this.segmentWidth) / 2.0;
            context.fillStyle = this.getSegmentColor(c, '2345689abdefhnoprty-=');
            context.beginPath();
            context.moveTo(x + s + d, y + s);
            context.lineTo(x + this.segmentWidth + d, y);
            context.lineTo(x + this.digitWidth - this.segmentWidth - d, y);
            context.lineTo(x + this.digitWidth - s - d, y + s);
            context.lineTo(x + this.digitWidth - this.segmentWidth - d, y + this.segmentWidth);
            context.lineTo(x + this.segmentWidth + d, y + this.segmentWidth);
            context.fill();
          }
                
          // draw inner segments for the fourteen- and sixteen-segment-display
          if (this.segmentCount != 7) {
            // draw segment g1
            x = xPos;
            y = (this.digitHeight - this.segmentWidth) / 2.0;
            context.fillStyle = this.getSegmentColor(c, null, '2345689aefhkprsy-+*=', '%');
            context.beginPath();
            context.moveTo(x + s + d, y + s);
            context.lineTo(x + this.segmentWidth + d, y);
            context.lineTo(x + t - d - s, y);
            context.lineTo(x + t - d, y + s);
            context.lineTo(x + t - d - s, y + this.segmentWidth);
            context.lineTo(x + this.segmentWidth + d, y + this.segmentWidth);
            context.fill();
            
            // draw segment g2
            x = xPos;
            y = (this.digitHeight - this.segmentWidth) / 2.0;
            context.fillStyle = this.getSegmentColor(c, null, '234689abefghprsy-+*=@', '%');
            context.beginPath();
            context.moveTo(x + t + d, y + s);
            context.lineTo(x + t + d + s, y);
            context.lineTo(x + this.digitWidth - this.segmentWidth - d, y);
            context.lineTo(x + this.digitWidth - s - d, y + s);
            context.lineTo(x + this.digitWidth - this.segmentWidth - d, y + this.segmentWidth);
            context.lineTo(x + t + d + s, y + this.segmentWidth);
            context.fill();
            
            // draw segment j 
            x = xPos + t - s;
            y = 0;
            context.fillStyle = this.getSegmentColor(c, null, 'bdit+*', '%');
            context.beginPath();
            if (this.segmentCount == 14) {
              context.moveTo(x, y + this.segmentWidth + this.segmentDistance);
              context.lineTo(x + this.segmentWidth, y + this.segmentWidth + this.segmentDistance);
            } else {
              context.moveTo(x, y + this.segmentWidth + d);
              context.lineTo(x + s, y + s + d);
              context.lineTo(x + this.segmentWidth, y + this.segmentWidth + d);
            }
            context.lineTo(x + this.segmentWidth, y + h + this.segmentWidth - d);
            context.lineTo(x + s, y + h + this.segmentWidth + s - d);
            context.lineTo(x, y + h + this.segmentWidth - d);
            context.fill();
            
            // draw segment m
            x = xPos + t - s;
            y = this.digitHeight;
            context.fillStyle = this.getSegmentColor(c, null, 'bdity+*@', '%');
            context.beginPath();
            if (this.segmentCount == 14) {
              context.moveTo(x, y - this.segmentWidth - this.segmentDistance);
              context.lineTo(x + this.segmentWidth, y - this.segmentWidth - this.segmentDistance);
            } else {
              context.moveTo(x, y - this.segmentWidth - d);
              context.lineTo(x + s, y - s - d);
              context.lineTo(x + this.segmentWidth, y - this.segmentWidth - d);
            }
            context.lineTo(x + this.segmentWidth, y - h - this.segmentWidth + d);
            context.lineTo(x + s, y - h - this.segmentWidth - s + d);
            context.lineTo(x, y - h - this.segmentWidth + d);
            context.fill();
            
            // draw segment h
            x = xPos + this.segmentWidth;
            y = this.segmentWidth;
            context.fillStyle = this.getSegmentColor(c, null, 'mnx\\*');
            context.beginPath();
            context.moveTo(x + this.segmentDistance, y + this.segmentDistance);
            context.lineTo(x + this.segmentDistance + r, y + this.segmentDistance);
            context.lineTo(x + w - this.segmentDistance , y + h - this.segmentDistance - r);
            context.lineTo(x + w - this.segmentDistance , y + h - this.segmentDistance);
            context.lineTo(x + w - this.segmentDistance - r , y + h - this.segmentDistance);
            context.lineTo(x + this.segmentDistance, y + this.segmentDistance + r);
            context.fill();
            
            // draw segment k
            x = xPos + w + 2.0 * this.segmentWidth;
            y = this.segmentWidth;
            context.fillStyle = this.getSegmentColor(c, null, '0kmvxz/*', '%');
            context.beginPath();
            context.moveTo(x + w - this.segmentDistance, y + this.segmentDistance);
            context.lineTo(x + w - this.segmentDistance, y + this.segmentDistance + r);
            context.lineTo(x + this.segmentDistance + r, y + h - this.segmentDistance);
            context.lineTo(x + this.segmentDistance, y + h - this.segmentDistance);
            context.lineTo(x + this.segmentDistance, y + h - this.segmentDistance - r);
            context.lineTo(x + w - this.segmentDistance - r, y + this.segmentDistance);
            context.fill();
            
            // draw segment l
            x = xPos + w + 2.0 * this.segmentWidth;
            y = h + 2.0 * this.segmentWidth;
            context.fillStyle = this.getSegmentColor(c, null, '5knqrwx\\*');
            context.beginPath();
            context.moveTo(x + this.segmentDistance, y + this.segmentDistance);
            context.lineTo(x + this.segmentDistance + r, y + this.segmentDistance);
            context.lineTo(x + w - this.segmentDistance , y + h - this.segmentDistance - r);
            context.lineTo(x + w - this.segmentDistance , y + h - this.segmentDistance);
            context.lineTo(x + w - this.segmentDistance - r , y + h - this.segmentDistance);
            context.lineTo(x + this.segmentDistance, y + this.segmentDistance + r);
            context.fill();
            
            // draw segment n
            x = xPos + this.segmentWidth;
            y = h + 2.0 * this.segmentWidth;
            context.fillStyle = this.getSegmentColor(c, null, '0vwxz/*', '%');
            context.beginPath();
            context.moveTo(x + w - this.segmentDistance, y + this.segmentDistance);
            context.lineTo(x + w - this.segmentDistance, y + this.segmentDistance + r);
            context.lineTo(x + this.segmentDistance + r, y + h - this.segmentDistance);
            context.lineTo(x + this.segmentDistance, y + h - this.segmentDistance);
            context.lineTo(x + this.segmentDistance, y + h - this.segmentDistance - r);
            context.lineTo(x + w - this.segmentDistance - r, y + this.segmentDistance);
            context.fill();
          }
          
          return this.digitDistance + this.digitWidth;
          
        case '.':
          context.fillStyle = (c == '#') || (c == '.') ? this.colorOn : this.colorOff;
          this.drawPoint(context, xPos, this.digitHeight - this.segmentWidth, this.segmentWidth);
          return this.digitDistance + this.segmentWidth;
          
        case ':':
          context.fillStyle = (c == '#') || (c == ':') ? this.colorOn : this.colorOff;
          var y = (this.digitHeight - this.segmentWidth) / 2.0 - this.segmentWidth;
          this.drawPoint(context, xPos, y, this.segmentWidth);
          this.drawPoint(context, xPos, y + 2.0 * this.segmentWidth, this.segmentWidth);
          return this.digitDistance + this.segmentWidth;
          
        default:
          return this.digitDistance;    
      }
    };

    SegmentDisplay.prototype.drawPoint = function(context, x1, y1, size) {
      var x2 = x1 + size;
      var y2 = y1 + size;
      var d  = size / 4.0;
      
      context.beginPath();
      context.moveTo(x2 - d, y1);
      context.quadraticCurveTo(x2, y1, x2, y1 + d);
      context.lineTo(x2, y2 - d);
      context.quadraticCurveTo(x2, y2, x2 - d, y2);
      context.lineTo(x1 + d, y2);
      context.quadraticCurveTo(x1, y2, x1, y2 - d);
      context.lineTo(x1, y1 + d);
      context.quadraticCurveTo(x1, y1, x1 + d, y1);
      context.fill();
    }; 

    SegmentDisplay.prototype.getSegmentColor = function(c, charSet7, charSet14, charSet16) {
      if (c == '#') {
        return this.colorOn;
      } else {
        switch (this.segmentCount) {
          case 7:  return (charSet7.indexOf(c) == -1) ? this.colorOff : this.colorOn;
          case 14: return (charSet14.indexOf(c) == -1) ? this.colorOff : this.colorOn;
          case 16: var pattern = charSet14 + (charSet16 === undefined ? '' : charSet16);
                   return (pattern.indexOf(c) == -1) ? this.colorOff : this.colorOn;
          default: return this.colorOff;
        }
      }
    };

    /*function styleDisplay(disp, pattern, height, width, black) {
        disp.pattern         = pattern;
        disp.digitHeight     = height;
        disp.digitWidth      = width;
        disp.displayAngle    = 6;
        disp.digitDistance   = 2.5;
        disp.segmentWidth    = 2;
        disp.segmentDistance = 0.3;
        disp.segmentCount    = 7;
        disp.cornerType      = 3;
        if (black) {
          disp.colorOn         = "#000000";
          disp.colorOff        = "#ebebeb";
        } else {
          disp.colorOn         = "#ffffff";
          disp.colorOff        = "#ababab";
        }
    }*/

    var display = new SegmentDisplay("display");
    display.pattern         = "#########";
    display.displayAngle    = 6;
    display.digitHeight     = 35;
    display.digitWidth      = 25;
    display.digitDistance   = 4;
    display.segmentWidth    = 4;
    display.segmentDistance = 0.3;
    display.segmentCount    = 7;
    display.cornerType      = 3;
    display.colorOn         = "#000000";
    display.colorOff        = "#ebebeb";
    display.draw();

    var peakdisplay = new SegmentDisplay("peakdisplay");
    peakdisplay.pattern         = "#######";
    peakdisplay.displayAngle    = 6;
    peakdisplay.digitHeight     = 15;
    peakdisplay.digitWidth      = 11;
    peakdisplay.digitDistance   = 2.5;
    peakdisplay.segmentWidth    = 2;
    peakdisplay.segmentDistance = 0.3;
    peakdisplay.segmentCount    = 7;
    peakdisplay.cornerType      = 3;
    peakdisplay.colorOn         = "#ffffff";
    peakdisplay.colorOff        = "#4c4c4c";
    peakdisplay.draw();

    var peakamtdisplay = new SegmentDisplay("peakamtdisplay");
    peakamtdisplay.pattern         = "#######";
    peakamtdisplay.displayAngle    = 6;
    peakamtdisplay.digitHeight     = 15;
    peakamtdisplay.digitWidth      = 11;
    peakamtdisplay.digitDistance   = 2.5;
    peakamtdisplay.segmentWidth    = 2;
    peakamtdisplay.segmentDistance = 0.3;
    peakamtdisplay.segmentCount    = 7;
    peakamtdisplay.cornerType      = 3;
    peakamtdisplay.colorOn         = "#ffffff";
    peakamtdisplay.colorOff        = "#4c4c4c";
    peakamtdisplay.draw();

    var kwhdisplay = new SegmentDisplay("kwhdisplay");
    kwhdisplay.pattern         = "#########";
    kwhdisplay.displayAngle    = 6;
    kwhdisplay.digitHeight     = 14;
    kwhdisplay.digitWidth      = 9;
    kwhdisplay.digitDistance   = 2.5;
    kwhdisplay.segmentWidth    = 2;
    kwhdisplay.segmentDistance = 0.3;
    kwhdisplay.segmentCount    = 7;
    kwhdisplay.cornerType      = 3;
    kwhdisplay.colorOn         = "#ffffff";
    kwhdisplay.colorOff        = "#4c4c4c";
    kwhdisplay.draw();

    var kwhamtdisplay = new SegmentDisplay("kwhamtdisplay");
    kwhamtdisplay.pattern         = "#######";
    kwhamtdisplay.displayAngle    = 6;
    kwhamtdisplay.digitHeight     = 15;
    kwhamtdisplay.digitWidth      = 11;
    kwhamtdisplay.digitDistance   = 2.5;
    kwhamtdisplay.segmentWidth    = 2;
    kwhamtdisplay.segmentDistance = 0.3;
    kwhamtdisplay.segmentCount    = 7;
    kwhamtdisplay.cornerType      = 3;
    kwhamtdisplay.colorOn         = "#ffffff";
    kwhamtdisplay.colorOff        = "#4c4c4c";
    kwhamtdisplay.draw();

    var carbondisplay = new SegmentDisplay("carbondisplay");
    carbondisplay.pattern         = "#######";
    carbondisplay.displayAngle    = 6;
    carbondisplay.digitHeight     = 15;
    carbondisplay.digitWidth      = 11;
    carbondisplay.digitDistance   = 2.5;
    carbondisplay.segmentWidth    = 2;
    carbondisplay.segmentDistance = 0.3;
    carbondisplay.segmentCount    = 7;
    carbondisplay.cornerType      = 3;
    carbondisplay.colorOn         = "#ffffff";
    carbondisplay.colorOff        = "#4c4c4c";
    carbondisplay.draw();

    var carbonamtdisplay = new SegmentDisplay("carbonamtdisplay");
    carbonamtdisplay.pattern         = "#######";
    carbonamtdisplay.displayAngle    = 6;
    carbonamtdisplay.digitHeight     = 15;
    carbonamtdisplay.digitWidth      = 11;
    carbonamtdisplay.digitDistance   = 2.5;
    carbonamtdisplay.segmentWidth    = 2;
    carbonamtdisplay.segmentDistance = 0.3;
    carbonamtdisplay.segmentCount    = 7;
    carbonamtdisplay.cornerType      = 3;
    carbonamtdisplay.colorOn         = "#ffffff";
    carbonamtdisplay.colorOff        = "#4c4c4c";
    carbonamtdisplay.draw();

    var i2rlossdisplay = new SegmentDisplay("i2rlossdisplay");
    i2rlossdisplay.pattern         = "#######";
    i2rlossdisplay.displayAngle    = 6;
    i2rlossdisplay.digitHeight     = 15;
    i2rlossdisplay.digitWidth      = 11;
    i2rlossdisplay.digitDistance   = 2.5;
    i2rlossdisplay.segmentWidth    = 2;
    i2rlossdisplay.segmentDistance = 0.3;
    i2rlossdisplay.segmentCount    = 7;
    i2rlossdisplay.cornerType      = 3;
    i2rlossdisplay.colorOn         = "#ffffff";
    i2rlossdisplay.colorOff        = "#4c4c4c";
    i2rlossdisplay.draw();

    var i2rlossamtdisplay = new SegmentDisplay("i2rlossamtdisplay");
    i2rlossamtdisplay.pattern         = "#######";
    i2rlossamtdisplay.displayAngle    = 6;
    i2rlossamtdisplay.digitHeight     = 15;
    i2rlossamtdisplay.digitWidth      = 11;
    i2rlossamtdisplay.digitDistance   = 2.5;
    i2rlossamtdisplay.segmentWidth    = 2;
    i2rlossamtdisplay.segmentDistance = 0.3;
    i2rlossamtdisplay.segmentCount    = 7;
    i2rlossamtdisplay.cornerType      = 3;
    i2rlossamtdisplay.colorOn         = "#ffffff";
    i2rlossamtdisplay.colorOff        = "#4c4c4c";
    i2rlossamtdisplay.draw();


    var value = Math.round(this.realTimeData.totalSavings) + ' ';
    value = '      '.substr(0, display.pattern.length  - (value.length-1)) + value;
    display.setValue(value);
    var peakvalue = Math.round(this.realTimeData.peakSavings) + ' ';
    peakvalue = '      '.substr(0, peakdisplay.pattern.length  - (peakvalue.length-1)) + peakvalue;
    peakdisplay.setValue(peakvalue);
    var peakamtvalue = Math.round(this.realTimeData.peakSavingsAmount) + ' ';
    peakamtvalue = '      '.substr(0, peakamtdisplay.pattern.length  - (peakamtvalue.length-1)) + peakamtvalue;
    peakamtdisplay.setValue(peakamtvalue);
    var kwhvalue = Math.round(this.realTimeData.kwhSavings) + ' ';
    kwhvalue = '      '.substr(0, kwhdisplay.pattern.length  - (kwhvalue.length-1)) + kwhvalue;
    kwhdisplay.setValue(kwhvalue);
    var kwhamtvalue = Math.round(this.realTimeData.kwhSavingsAmount) + ' ';
    kwhamtvalue = '      '.substr(0, kwhamtdisplay.pattern.length  - (kwhamtvalue.length-1)) + kwhamtvalue;
    kwhamtdisplay.setValue(kwhamtvalue);
    var carbonvalue = Math.round(this.realTimeData.carbonSavings) + ' ';
    carbonvalue = '      '.substr(0, carbondisplay.pattern.length  - (carbonvalue.length-1)) + carbonvalue;
    carbondisplay.setValue(carbonvalue);
    var carbonamtvalue = Math.round(this.realTimeData.carbonSavingsAmount) + ' ';
    carbonamtvalue = '      '.substr(0, carbonamtdisplay.pattern.length  - (carbonamtvalue.length-1)) + carbonamtvalue;
    carbonamtdisplay.setValue(carbonamtvalue);
    var i2rlossvalue = Math.round(this.realTimeData.I2RLossSavings) + ' ';
    i2rlossvalue = '      '.substr(0, i2rlossdisplay.pattern.length  - (i2rlossvalue.length-1)) + i2rlossvalue;
    i2rlossdisplay.setValue(i2rlossvalue);
    var i2rlossamtvalue = Math.round(this.realTimeData.I2RLossSavingsAmount) + ' ';
    i2rlossamtvalue = '      '.substr(0, i2rlossamtdisplay.pattern.length - (i2rlossamtvalue.length-1)) + i2rlossamtvalue;
    i2rlossamtdisplay.setValue(i2rlossamtvalue);
	}
	
	renderDataTimeout = null
	loadedData = {}
  /**
   * Render the given data into the UI.
   * @param  {Dictionary} data
   */
  async renderData() {
		if(this.renderDataTimeout) {
			clearTimeout(this.renderDataTimeout);
			this.renderDataTimeout = null
		}

		if(!this.realTimeData) await this.loadData()

		this.realTimeData = {...this.loadedData[this.projectSelected]}

		this.selectedProjectName = this.projects.find(project => project.id == this.projectSelected)?.name || 'ALL SITES'

		const elapsed = Date.now() - this.dataLoadedTimestamp
		const K = 0.00005

		for(let key in this.realTimeData) {
			if(key === 'id') continue
			if(key === 'peakSavings' || key === 'peakSavingsAmount') continue; 
			this.realTimeData[key] *=  (1 - K) + K * elapsed/this.dataRefreshInterval
		}

		this.jsTicker();
		
		this.renderDataTimeout = setTimeout(() =>  { 
			this.renderData();
		}, 1000);
	}

	dataLoadedTimestamp = null
	dataRefreshInterval = 300000
	loadDataTimeout = null
	
	async loadData() {
		if(this.loadDataTimeout) {
			clearTimeout(this.loadDataTimeout)
			this.loadDataTimeout = null
		}

		let data: string;
		try {
			data = await this.http.get('/files/ticker2.txt', {responseType: 'text'}).toPromise();
		} catch (err) {
			// ticker2.txt may not exist (e.g. before rollup runs); use empty data
			data = '';
		}
		this.dataLoadedTimestamp = Date.now();
		if (!data || !data.trim()) {
			this.loadDataTimeout = setTimeout(() => this.loadData(), this.dataRefreshInterval);
			return;
		}
		
		data.trim().split('\n').forEach(line => {
				const [
								id,
								totalSavings,
								kwhSavings,
								kwhSavingsAmount,
								peakSavings,
								peakSavingsAmount,
								I2RLossSavings,
								I2RLossSavingsAmount,
								carbonSavings,
								carbonSavingsAmount
							] = line.trim().split(',').map(value => parseInt(value))

				this.loadedData[id || 0] = {
					totalSavings,
					kwhSavings,
					kwhSavingsAmount,
					peakSavings,
					peakSavingsAmount,
					I2RLossSavings,
					I2RLossSavingsAmount,
					carbonSavings,
					carbonSavingsAmount
				}
		})

		this.loadDataTimeout = setTimeout(() => this.loadData(), this.dataRefreshInterval)
	}

}
