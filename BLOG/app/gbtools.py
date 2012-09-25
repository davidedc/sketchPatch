#!/usr/bin/env python
# -*- coding:GBK -*-

"""���ִ���Ĺ���:
�ж�unicode�Ƿ��Ǻ��֣����֣�Ӣ�ģ����������ַ���
ȫ�Ƿ���ת��Ƿ��š�"""

__author__="internetsweeper <zhengbin0713@gmail.com>"
__date__="2007-08-04"

def is_chinese(uchar):
        """�ж�һ��unicode�Ƿ��Ǻ���"""
        if uchar >= u'\u4e00' and uchar<=u'\u9fa5':
                return True
        else:
                return False

def is_number(uchar):
        """�ж�һ��unicode�Ƿ�������"""
        if uchar >= u'\u0030' and uchar<=u'\u0039':
                return True
        else:
                return False

def is_alphabet(uchar):
        """�ж�һ��unicode�Ƿ���Ӣ����ĸ"""
        if (uchar >= u'\u0041' and uchar<=u'\u005a') or (uchar >= u'\u0061' and uchar<=u'\u007a'):
                return True
        else:
                return False

def is_other(uchar):
        """�ж��Ƿ�Ǻ��֣����ֺ�Ӣ���ַ�"""
        if not (is_chinese(uchar) or is_number(uchar) or is_alphabet(uchar)):
                return True
        else:
                return False

def B2Q(uchar):
        """���תȫ��"""
        inside_code=ord(uchar)
        if inside_code<0x0020 or inside_code>0x7e:      #���ǰ���ַ��ͷ���ԭ�����ַ�
                return uchar
        if inside_code==0x0020: #���˿ո�������ȫ�ǰ�ǵĹ�ʽΪ:���=ȫ��-0xfee0
                inside_code=0x3000
        else:
                inside_code+=0xfee0
        return unichr(inside_code)

def Q2B(uchar):
        """ȫ��ת���"""
        inside_code=ord(uchar)
        if inside_code==0x3000:
                inside_code=0x0020
        else:
                inside_code-=0xfee0
        if inside_code<0x0020 or inside_code>0x7e:      #ת��֮���ǰ���ַ�����ԭ�����ַ�
                return uchar
        return unichr(inside_code)

def stringQ2B(ustring):
        """���ַ���ȫ��ת���"""
        return "".join([Q2B(uchar) for uchar in ustring])

def uniform(ustring):
        """��ʽ���ַ��������ȫ��ת��ǣ���дתСд�Ĺ���"""
        return stringQ2B(ustring).lower()

def string2List(ustring):
        """��ustring�������ģ���ĸ�����ַֿ�"""
        retList=[]
        utmp=[]
        for uchar in ustring:
                if is_other(uchar):
                        if not len(utmp):
                                continue
                        else:
                                retList.append("".join(utmp))
                                utmp=[]
                else:
                        utmp.append(uchar)
        if len(utmp):
                retList.append("".join(utmp))
        return retList

if __name__=="__main__":
        #test Q2B and B2Q
        for i in range(0x0020,0x007F):
                print Q2B(B2Q(unichr(i))),B2Q(unichr(i))

        #test uniform
        ustring=u'�й� �������Ƶ��'
        ustring=uniform(ustring)
        ret=string2List(ustring)
        print ret
