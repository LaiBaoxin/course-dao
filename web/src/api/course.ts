import request from '../utils/request';

export interface PremiumCourseResp {
    title: string;
    video_url: string;
}

// 获取高级课程
export const getPremiumCourse = () => {
    return request.get<any, PremiumCourseResp>('http://localhost:8889/v1/course/premium');
};
