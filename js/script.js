function calculateTotal() {
    // 0. 도시 개요 데이터
    const totalArea = parseFloat(document.getElementById('totalArea').value) || 0;
    const population = parseFloat(document.getElementById('population').value) || 0;

    // 점수 합계를 위한 변수
    let scorePart1 = 0;
    let scorePart2 = 0;
    let scorePart3 = 0;

    // --- PART I: 자생 생물다양성 (지표 1~9) ---
    
    // 1. 자연지역 비율 (면적 %)
    let s1 = 0;
    if (totalArea > 0) {
        const val1 = parseFloat(document.getElementById('ind1_val').value) || 0;
        const ratio1 = (val1 / totalArea) * 100;
        if (ratio1 > 20.0) s1 = 4;
        else if (ratio1 >= 14.0) s1 = 3;
        else if (ratio1 >= 7.0) s1 = 2;
        else if (ratio1 >= 1.0) s1 = 1;
    }
    updateBadge('ind1_score', s1);
    scorePart1 += s1;

    // 2. 연결성 (선택형)
    const s2 = parseInt(document.getElementById('ind2_val').value) || 0;
    updateBadge('ind2_score', s2);
    scorePart1 += s2;

    // 3. 조류 종 수 (개수) - 예시 기준: >50종 4점 (도시마다 기준 다를 수 있음)
    let s3 = 0;
    const val3 = parseFloat(document.getElementById('ind3_val').value) || 0;
    if (val3 > 50) s3 = 4;
    else if (val3 > 35) s3 = 3;
    else if (val3 > 20) s3 = 2;
    else if (val3 > 5) s3 = 1;
    updateBadge('ind3_score', s3);
    scorePart1 += s3;

    // 4~6. 변화량 (현재 >= 과거면 만점 로직으로 단순화)
    // *실제 CBI는 구체적인 통계적 변화 유의성을 보지만, 시뮬레이터는 단순 비교 사용
    function calcChangeScore(baseId, currId) {
        const base = parseFloat(document.getElementById(baseId).value);
        const curr = parseFloat(document.getElementById(currId).value);
        if (isNaN(base) || isNaN(curr)) return 0;
        if (curr >= base) return 4; // 유지 또는 증가
        if (curr >= base * 0.9) return 3; // 소폭 감소
        if (curr >= base * 0.7) return 2;
        if (curr >= base * 0.5) return 1;
        return 0;
    }
    
    const s4 = calcChangeScore('ind4_base', 'ind4_curr');
    updateBadge('ind4_score', s4);
    scorePart1 += s4;

    const s5 = calcChangeScore('ind5_base', 'ind5_curr');
    updateBadge('ind5_score', s5);
    scorePart1 += s5;

    const s6 = calcChangeScore('ind6_base', 'ind6_curr');
    updateBadge('ind6_score', s6);
    scorePart1 += s6;

    // 7. 복원 (선택형)
    const s7 = parseInt(document.getElementById('ind7_val').value) || 0;
    updateBadge('ind7_score', s7);
    scorePart1 += s7;

    // 8. 보호지역 비율 (면적 %)
    let s8 = 0;
    if (totalArea > 0) {
        const val8 = parseFloat(document.getElementById('ind8_val').value) || 0;
        const ratio8 = (val8 / totalArea) * 100;
        if (ratio8 > 20.0) s8 = 4; // CBI 기준에 따라 11% 이상일 수도 있음
        else if (ratio8 >= 10.0) s8 = 3;
        else if (ratio8 >= 5.0) s8 = 2;
        else if (ratio8 >= 1.0) s8 = 1;
    }
    updateBadge('ind8_score', s8);
    scorePart1 += s8;

    // 9. 침입외래종 (선택형)
    const s9 = parseInt(document.getElementById('ind9_val').value) || 0;
    updateBadge('ind9_score', s9);
    scorePart1 += s9;


    // --- PART II: 생태계 서비스 (지표 10~14) ---

    // 10. 투수층 비율
    let s10 = 0;
    if (totalArea > 0) {
        const val10 = parseFloat(document.getElementById('ind10_val').value) || 0;
        const ratio10 = (val10 / totalArea) * 100;
        if (ratio10 >= 75) s10 = 4;
        else if (ratio10 >= 60) s10 = 3;
        else if (ratio10 >= 45) s10 = 2;
        else if (ratio10 >= 30) s10 = 1;
    }
    updateBadge('ind10_score', s10);
    scorePart2 += s10;

    // 11. 수관피복도
    let s11 = 0;
    if (totalArea > 0) {
        const val11 = parseFloat(document.getElementById('ind11_val').value) || 0;
        const ratio11 = (val11 / totalArea) * 100;
        if (ratio11 >= 50) s11 = 4; // 일반적인 녹색도시 기준
        else if (ratio11 >= 40) s11 = 3;
        else if (ratio11 >= 30) s11 = 2;
        else if (ratio11 >= 20) s11 = 1;
    }
    updateBadge('ind11_score', s11);
    scorePart2 += s11;

    // 12. 1인당 공원면적 (ha/1000명)
    let s12 = 0;
    if (population > 0) {
        const val12 = parseFloat(document.getElementById('ind12_val').value) || 0;
        const ratio12 = val12 / (population / 1000);
        if (ratio12 > 1.0) s12 = 4; // 1ha 이상
        else if (ratio12 > 0.7) s12 = 3;
        else if (ratio12 > 0.4) s12 = 2;
        else if (ratio12 > 0.1) s12 = 1;
    }
    updateBadge('ind12_score', s12);
    scorePart2 += s12;

    // 13. 접근성 (%)
    let s13 = 0;
    const val13 = parseFloat(document.getElementById('ind13_val').value) || 0;
    if (val13 >= 90) s13 = 4;
    else if (val13 >= 70) s13 = 3;
    else if (val13 >= 50) s13 = 2;
    else if (val13 >= 30) s13 = 1;
    updateBadge('ind13_score', s13);
    scorePart2 += s13;

    // 14. 도시농업 비율
    let s14 = 0;
    if (totalArea > 0) {
        const val14 = parseFloat(document.getElementById('ind14_val').value) || 0;
        const ratio14 = (val14 / totalArea) * 100;
        if (ratio14 >= 5.0) s14 = 4; // 예시 기준
        else if (ratio14 >= 3.0) s14 = 3;
        else if (ratio14 >= 1.0) s14 = 2;
        else if (ratio14 > 0) s14 = 1;
    }
    updateBadge('ind14_score', s14);
    scorePart2 += s14;


    // --- PART III: 거버넌스 (지표 15~28) ---
    // 대부분 선택형(Select)이므로 반복문으로 처리 가능
    const governanceIds = [
        'ind15_val', 'ind17_val', 'ind18_val', 'ind19_val', 
        'ind20_val', 'ind22_val', 'ind24_val', 'ind25_val', 
        'ind26_val', 'ind27_val', 'ind28_val'
    ];
    
    governanceIds.forEach(id => {
        const val = parseInt(document.getElementById(id).value) || 0;
        const scoreId = id.replace('_val', '_score');
        updateBadge(scoreId, val);
        scorePart3 += val;
    });

    // 개수 입력형 거버넌스 지표 (16, 21, 23)
    // 16. 프로젝트 수
    let s16 = 0;
    const val16 = parseFloat(document.getElementById('ind16_val').value) || 0;
    if (val16 >= 10) s16 = 4;
    else if (val16 >= 7) s16 = 3;
    else if (val16 >= 4) s16 = 2;
    else if (val16 >= 1) s16 = 1;
    updateBadge('ind16_score', s16);
    scorePart3 += s16;

    // 21. 파트너십 수
    let s21 = 0;
    const val21 = parseFloat(document.getElementById('ind21_val').value) || 0;
    if (val21 >= 10) s21 = 4;
    else if (val21 >= 5) s21 = 3;
    else if (val21 >= 3) s21 = 2;
    else if (val21 >= 1) s21 = 1;
    updateBadge('ind21_score', s21);
    scorePart3 += s21;

    // 23. 행사 수
    let s23 = 0;
    const val23 = parseFloat(document.getElementById('ind23_val').value) || 0;
    if (val23 >= 12) s23 = 4; // 월 1회 이상
    else if (val23 >= 6) s23 = 3;
    else if (val23 >= 3) s23 = 2;
    else if (val23 >= 1) s23 = 1;
    updateBadge('ind23_score', s23);
    scorePart3 += s23;


    // --- 최종 합계 표시 ---
    const totalScore = scorePart1 + scorePart2 + scorePart3;
    
    document.getElementById('part1-score').innerText = scorePart1;
    document.getElementById('part2-score').innerText = scorePart2;
    document.getElementById('part3-score').innerText = scorePart3;
    document.getElementById('total-score').innerText = totalScore;
    
    const resultDiv = document.getElementById('result-area');
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({behavior: 'smooth'});
}

function updateBadge(id, score) {
    const el = document.getElementById(id);
    el.innerText = score + "점";
    
    // 점수에 따른 색상 변경
    el.classList.remove('bad', 'mid', 'good', 'perfect');
    if (score === 4) el.classList.add('perfect');
    else if (score === 3) el.classList.add('good');
    else if (score >= 1) el.classList.add('mid');
    else el.classList.add('bad');
}
