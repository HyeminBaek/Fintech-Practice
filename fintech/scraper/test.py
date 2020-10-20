#print('hello')
#셀레니움은 웹페이지를 테스팅하기 위한 반복 작업을 해결하기 위해 만들어진 라이브러리
#가상의 드라이버를 띄워야 함
from selenium import webdriver
driver = webdriver.Chrome('./chromedriver')
driver.get('https://www.asiae.co.kr/article/2020072115182367372')
#//*[@id="container"]/div[3]/div[2]/div[2]/h3
title = driver.find_element_by_xpath('//*[@id="container"]/div[3]/div[2]/div[2]/h3').text
subject = driver.find_element_by_xpath('//*[@id="txt_area"]/div[2]/h4').text
print(title)
print(subject)